import { googleAI, vertexAI } from '@genkit-ai/google-genai';
import { genkit, z, Document } from 'genkit';
import { DocumentChunk, PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; // Direct import

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
}); // Singleton instance                                                                                                                                                                                                           LSPs are disabled

const model = 'gemini-3.5-flash';
const targetModel = vertexAI.model(model, {
  temperature: 0.7,
  thinkingConfig: { thinkingLevel: 'LOW' },
});

const ai = genkit({
  plugins: [
    //googleAI({ apiKey: process.env.GEMINI_API_KEY })
    vertexAI({ location: 'global' }),
  ],
});

const outputSchema = z.object({ text: z.string() });

const querySchema = z.object({
  message: z.string(),
  chatId: z.string(),
});

const sqlRetriever = ai.defineRetriever(
  {
    name: 'document_chunks',
    configSchema: querySchema,
  },
  async (input, options) => {
    const embedding = await ai.embed({
      embedder: vertexAI.embedder('text-embedding-004'),
      content: input,
      options: {
        outputDimensionality: 384, // Reduce from 768 to 384                                                                                                                                                                                                         MCP
      },
    });
    const embeddingArray = embedding[0].embedding;
    const embeddingString = `[${embeddingArray
      .map((v) => {
        const num = Number(v);
        return isFinite(num) ? num : 0;
      })
      .join(',')}]`;
    const document = await prisma.document.findMany({
      where: { chatId: options.chatId },
    });
    const docIds = document.map((el) => `'${el.id}'`).join(',');
    if (docIds.length === 0) {
      return { documents: [] };
    }
    console.log(
      `SELECT id, "documentId", content, metadata, "createdAt" FROM "document_chunks" WHERE "documentId" IN (${docIds}) ORDER BY embedding <=> '${embeddingString}'::vector LIMIT 5`,
    );
    const docs = (await prisma.$queryRawUnsafe(
      `SELECT id, "documentId", content, metadata, "createdAt" FROM "document_chunks" WHERE "documentId" IN (${docIds}) ORDER BY embedding <=> '${embeddingString}'::vector LIMIT 5`,
    )) as DocumentChunk[];
    return {
      documents: docs.map((row) => {
        const { content, ...metadata } = row;
        return Document.fromText(content, metadata);
      }),
    };
  },
);

export const genericFlow = ai.defineFlow(
  {
    name: 'genericFlow',
    inputSchema: z.object({
      message: z.string(),
      chatId: z.string(),
      inputMessageId: z.string(),
    }),
    outputSchema: outputSchema,
    streamSchema: outputSchema,
  },
  async (input, { sendChunk }) => {
    const docs = await ai.retrieve({
      retriever: sqlRetriever,
      query: input.message,
      options: {
        ...input,
      },
    });
    console.log(docs);
    const messages = await prisma.message.findMany({
      where: { chatId: input.chatId },
    });

    const { stream, response } = ai.generateStream({
      model: targetModel,
      prompt: `You are acting as helpful assitant. Use only the context provided to answer the question. If you dont know, do not make up an answer.
      Question: ${input.message}`,
      output: { schema: outputSchema },
      docs,
      messages: messages.map((el) => {
        return {
          content: [{text:el.content}],
          role: (el.role === 'USER' ? 'user' : 'model') as 'user' | 'model',
        };
      }),
    });

    for await (const chunk of stream) {
      if (chunk.output) sendChunk(chunk.output);
    }

    const { output, usage } = await response;
    console.log(usage.inputTokens,usage.outputTokens,input.inputMessageId);
    if (!output) throw new Error('Failed to generate response');
    await prisma.message.update({
      where:{id: input.inputMessageId},
      data: {
        tokenCount: usage.inputTokens,
      },
    });
    await prisma.message.create({
      data: {
        chatId: input.chatId,
        role: 'ASSISTANT',
        content: output.text,
        tokenCount:usage.outputTokens
      },
    });
    return output;
  },
);
