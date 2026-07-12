import { googleAI, vertexAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';  // Direct import
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
}); // Singleton instance                                                                                                                                                                                                           LSPs are disabled

const model = 'gemini-3.1-pro-preview';
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

export const genericFlow = ai.defineFlow(
  {
    name: 'genericFlow',
    inputSchema: z.object({
      message: z.string(),
      chatId: z.string()
    }),
    outputSchema: outputSchema,
    streamSchema: outputSchema,
  },
  async (input, { sendChunk }) => {
    const { stream, response } = ai.generateStream({
      model: targetModel,
      prompt: `${input.message}`,
      output: { schema: outputSchema },
    });

    for await (const chunk of stream) {
      if (chunk.output) sendChunk(chunk.output);
    }

    const { output } = await response;
    if (!output) throw new Error('Failed to generate response');
    await prisma.message.create({
      data: {
        chatId: input.chatId,
        role: 'ASSISTANT',
        content: output.text,
      },
    });
    return output;
  },
);
