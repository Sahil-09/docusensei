import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z, Document, modelRef } from 'genkit';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; // Direct import
import { openAICompatible } from '@genkit-ai/compat-oai';
import { contextCompression, fallback } from '@genkit-ai/middleware';

interface RankedDocument {
  id: string;
  documentId: string;
  content: string;
  metadata: any;
  createdAt: Date;
}
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const models = process.env.AI_MODEL.split(',');
const model = models[0] || 'openrouter/baidu/ernie-5.5-flash-preview:free';
// const targetModel = googleAI.model(model, {
//   temperature: 0.8,
// });
const targetModel = modelRef({
  name: model,
});
const fallbackModel = modelRef({
  name: models[1],
});
const fallbackModel2 = modelRef({
  name: models[2],
});
const fallbackModel3 = modelRef({
  name: models[3],
});

const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY }),
    openAICompatible({
      name: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY, // Required, but can be a placeholder for local servers
      baseURL: 'https://openrouter.ai/api/v1', // Example for Ollama
    }),
    //vertexAI({ location: 'global' }),
  ],
});

const modelOutputSchema = z.object({
  text: z.string(),
  systemInfoMessage: z
    .object({
      text: z.string().optional(),
      meta: z
        .object({
          inputToken: z.number(),
          outputToken: z.number(),
        })
        .optional(),
    })
    .optional(),
});

const flowOutputSchema = z.object({
  text: z.string(),
  retrievedDocs: z.array(z.string()).optional(),
  systemInfoMessage: z.object({
    text: z.string().optional(),
    meta: z
      .object({
        inputToken: z.number(),
        outputToken: z.number(),
        elapsed: z.number(),
      })
      .optional(),
  }),
});

const querySchema = z.object({
  message: z.string(),
  chatId: z.string(),
  isEval: z.boolean().default(false),
  k: z.number(),
});

const sqlRetriever = ai.defineRetriever(
  {
    name: 'document_chunks',
    configSchema: querySchema,
  },
  async (input, options) => {
    const document = await prisma.document.findMany({
      where: { chatId: options.chatId },
    });
    const docIds = document.map((el) => `'${el.id}'`).join(',');
    if (docIds.length === 0) {
      return { documents: [] };
    }
    const messages = options.isEval
      ? await prisma.message.findMany({
          where: { chatId: options.chatId },
          orderBy: { createdAt: 'desc' },
        })
      : [];
    const messageContents = messages.length
      ? messages
          .filter((el) => el.role === 'USER')
          .map((el) => el.content)
          .join('\n')
      : options.message;
    const embedding = await ai.embed({
      embedder: googleAI.embedder('gemini-embedding-001'),
      content: messageContents,
      options: {
        outputDimensionality: 384, // Reduce from 768 to 384
      },
    });
    const embeddingArray = embedding[0].embedding;
    const embeddingString = `[${embeddingArray
      .map((v) => {
        const num = Number(v);
        return isFinite(num) ? num : 0;
      })
      .join(',')}]`;
    const sanitizedQuery = options.message.replace(/'/g, "''");
    const vectorQuery = `
       SELECT id, "documentId", content, metadata, "createdAt"
       FROM "docusensei"."document_chunks"
       WHERE "documentId" IN (${docIds})
       ORDER BY embedding <=> '${embeddingString}'::vector
       LIMIT ${options.k}
     `;
    const keywordQuery = `
       SELECT id, "documentId", content, metadata, "createdAt"
       FROM "docusensei"."document_chunks"
       WHERE "documentId" IN (${docIds})
         AND to_tsvector('english', content) @@ websearch_to_tsquery('english', '${sanitizedQuery}')
       ORDER BY ts_rank_cd(to_tsvector('english', content), websearch_to_tsquery('english', '${sanitizedQuery}')) DESC
       LIMIT ${options.k}
     `;
    const [vectorDocs, keywordDocs] = await Promise.all([
      prisma.$queryRawUnsafe<RankedDocument[]>(vectorQuery),
      prisma.$queryRawUnsafe<RankedDocument[]>(keywordQuery),
    ]);
    // Apply RRF to fuse results
    const fusedDocs = reciprocalRankFusion(vectorDocs, keywordDocs).slice(
      0,
      options.k,
    );
    function reciprocalRankFusion(
      vectorResults: RankedDocument[],
      keywordResults: RankedDocument[],
      k = 60, // standard constant to scale rank importance
    ): RankedDocument[] {
      const scoreMap = new Map<
        string,
        { doc: RankedDocument; score: number }
      >();

      // Process Vector Ranks
      vectorResults.forEach((doc, index) => {
        const rank = index + 1;
        scoreMap.set(doc.id, { doc, score: 1 / (k + rank) });
      });

      // Process Keyword Ranks
      keywordResults.forEach((doc, index) => {
        const rank = index + 1;
        const rrfScore = 1 / (k + rank);
        const existing = scoreMap.get(doc.id);
        if (existing) {
          existing.score += rrfScore;
        } else {
          scoreMap.set(doc.id, { doc, score: rrfScore });
        }
      });

      // Sort by fused score descending & attach score metadata
      return Array.from(scoreMap.values())
        .sort((a, b) => b.score - a.score)
        .map((item) => ({
          ...item.doc,
          metadata: {
            ...(typeof item.doc.metadata === 'object' ? item.doc.metadata : {}),
            rrfScore: item.score,
          },
        }));
    }

    const formatedDoc = fusedDocs.map((row) => {
      const { content, ...metadata } = row;
      return Document.fromText(content, metadata);
    });
    return {
      documents: formatedDoc,
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
      isEval: z.boolean().default(false),
    }),
    outputSchema: flowOutputSchema,
    streamSchema: modelOutputSchema,
  },
  async (input, { sendChunk }) => {
    sendChunk({ text: '', systemInfoMessage: { text: 'Thinking 🤖' } });
    const startTime = new Date().getTime();
    sendChunk({
      text: '',
      systemInfoMessage: { text: 'Retrieving Documents' },
    });
    const docs = await ai.retrieve({
      retriever: sqlRetriever,
      query: input.message,
      options: {
        ...input,
        k: 25,
      },
    });
    sendChunk({
      text: '',
      systemInfoMessage: {
        text: `${docs.length} Document(s) Chunks Retrieved`,
      },
    });
    const messages = !input.isEval
      ? await prisma.message.findMany({
          where: { chatId: input.chatId },
        })
      : [];
    sendChunk({ text: '', systemInfoMessage: { text: `Preparing Context.` } });
    sendChunk({ text: '', systemInfoMessage: { text: `Preparing Context..` } });
    try {
      const { stream, response } = ai.generateStream({
        model: targetModel,
        prompt: `You are acting as helpful assistant. Use only the context provided to answer the question. If you dont know, do not make up an answer.
      If no context provided, ask user to upload document and check again. In answer dont say based on provided context. Just give answer
      Question: ${input.message}`,
        output: { schema: modelOutputSchema },
        docs,
        messages: messages
          .filter((el) => !!el.content)
          .map((el) => {
            return {
              content: [{ text: el.content }],
              role: (el.role === 'USER' ? 'user' : 'model') as 'user' | 'model',
            };
          }),
        use: [
          fallback({
            models: [fallbackModel, fallbackModel2, fallbackModel3],
            statuses: [
              'UNAVAILABLE',
              'DEADLINE_EXCEEDED',
              'RESOURCE_EXHAUSTED',
              'ABORTED',
              'INTERNAL',
              'NOT_FOUND',
              'UNIMPLEMENTED',
            ],
          }),
          contextCompression({
            maxInputTokens: 80000,

            deduplicateToolResponses: {
              matchBy: 'name-and-input',
            },

            toolResponses: {
              maxChars: 2000,
              preserveRecent: 2,
            },

            summarize: {
              model: fallbackModel,
              preserveRecent: 6,
            },

            preserveOriginalMessages: true,
          }),
        ],
      });

      sendChunk({
        text: '',
        systemInfoMessage: { text: `Analyzing the documents` },
      });
      for await (const chunk of stream) {
        if (chunk.output) sendChunk(chunk.output);
      }

      const { output, usage } = await response;
      console.log(
        'inputToken:',
        usage.inputTokens,
        'outputToken:',
        usage.outputTokens,
        input.inputMessageId,
      );
      if (!output) throw new Error('Failed to generate response');
      if (!input.isEval) {
        await prisma.message.update({
          where: { id: input.inputMessageId },
          data: {
            tokenCount: usage.inputTokens,
          },
        });
        await prisma.message.create({
          data: {
            chatId: input.chatId,
            role: 'ASSISTANT',
            content: output.text,
            tokenCount: usage.outputTokens,
          },
        });
      }
      console.log(
        'Time Elapsed:' +
          ((new Date().getTime() - startTime) / 1000).toFixed(2) +
          's',
      );
      return {
        text: output.text,
        systemInfoMessage: {
          meta: {
            inputToken: usage.inputTokens,
            outputToken: usage.outputTokens,
            elapsed: new Date().getTime() - startTime,
          },
        },
        ...(input.isEval
          ? {
              retrievedDocs: Array.isArray(docs)
                ? docs.map((d: any) => d.text)
                : (docs as any).documents?.map((d: any) => d.text) || [],
            }
          : {}),
      };
    } catch (e) {
      console.error(e);
    }
  },
);
