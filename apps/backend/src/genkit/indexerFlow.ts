import { Document } from 'genkit/retriever';
import { chunk } from 'llm-chunk';
import { genkit, z } from 'genkit';
import { googleAI, vertexAI } from '@genkit-ai/google-genai';
import { PDFParse } from 'pdf-parse';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; // Direct import

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function extractTextFromPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  let result = await parser.getText();
  await parser.destroy();
  return result;
}

const chunkingConfig = {
  minLength: 600,
  maxLength: 1000,
  splitter: 'sentence',
  overlap: 50,
  delimiters: '',
} as any;

const model = 'gemini-3.5-flash';
const targetModel = vertexAI.model(model, {
  temperature: 0.7,
  thinkingConfig: { thinkingLevel: 'LOW' },
});

const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY })
    //vertexAI({ location: 'global' }),
  ],
});
const BufferSchema = z.instanceof(Buffer);

export const indexData = ai.defineFlow(
  {
    name: 'indexData',
    inputSchema: z.object({
      file: z.object({
        buffer: BufferSchema,
        originalname: z.string(),
      }),
      docId: z.string(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      documentsIndexed: z.number(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    try {
      // Read the pdf
      const pdfTxt = await ai.run('extract-text', () =>
        extractTextFromPdf(input.file.buffer),
      );

      // Divide the pdf text into segments
      const chunks = await ai.run('chunk-it', async () =>
        chunk(pdfTxt.text, chunkingConfig),
      );

      // Convert chunks of text into documents to store in the index.
      const documents = chunks.map((text) => {
        return Document.fromText(text, {
          meta: { fileName: input.file.originalname },
        });
      });

      // Add documents to the index
      const docIndex = await Promise.all(
        documents?.map(async (el: Document) => {
          const createDocChunk = await prisma.documentChunk.create({
            data: {
              documentId: input.docId,
              content: el.text,
            },
          });
          console.log(
            `Created document chunk with ID: ${createDocChunk.id} for document: ${input.docId}`,
          );

          const embedded = await ai.embed({
            embedder: googleAI.embedder('gemini-embedding-001'),
            content: el.text,
            options: {
              outputDimensionality: 384, // Reduce from 768 to 384                                                                                                                                                                                                         MCP
            },
          });
          const embeddingArray = embedded[0].embedding;
          const embeddingString = `[${embeddingArray
            .map((v) => {
              const num = Number(v);
              return isFinite(num) ? num : 0;
            })
            .join(',')}]`;
          const updateQuery = `UPDATE "document_chunks" SET "embedding" = '${embeddingString}'::vector WHERE "id" = '${createDocChunk.id}'`;
          await prisma.$executeRawUnsafe(updateQuery);
        }),
      );
      const updateDoc = await prisma.document.update({
        where: { id: input.docId },
        data: {
          processingStatus:'COMPLETED'
        },
      });
      return {
        success: true,
        documentsIndexed: documents.length,
      };
    } catch (err) {
      // For unexpected errors that throw exceptions
      return {
        success: false,
        documentsIndexed: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
);
