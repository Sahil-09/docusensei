import { googleAI, vertexAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';
import { logger } from 'genkit/logging';

const model = 'gemini-3.1-pro-preview';
const targetModel = vertexAI.model(model, {
  temperature: 0.7,
  thinkingConfig: { thinkingLevel: 'LOW' },
});

const ai = genkit({
  plugins: [
    //googleAI({ apiKey: process.env.GEMINI_API_KEY })
    vertexAI({location:'global'})
  ],
});
logger.setLogLevel('debug'); // Prints connection details

const outputSchema = z.object({ text: z.string() });

export const genericFlow = ai.defineFlow(
  {
    name: 'genericFlow',
    inputSchema:  z
        .string(),
    outputSchema: outputSchema,
    streamSchema: outputSchema
  },
  async (input, { sendChunk }) => {
    console.log(input);
    const { stream, response } = ai.generateStream({
      model: targetModel,
      prompt: `${input}`,
      output: { schema: outputSchema },
    });


    for await (const chunk of stream) {
      console.log(chunk.output);
      if (chunk.output) sendChunk(chunk.output);
    }

    const { output } = await response;
    if (!output) throw new Error('Failed to generate response');
    return output;
  },
);
