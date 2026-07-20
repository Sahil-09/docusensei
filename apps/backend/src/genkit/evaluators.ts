import { googleAI } from '@genkit-ai/google-genai';
import { genkit, z } from 'genkit';

const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GEMINI_API_KEY })
  ],
});

const JudgeOutputSchema = z.object({
  score: z.number().describe('A score between 0.0 (poor) and 1.0 (perfect)'),
  reason: z.string().describe('Clear reasoning for the assigned score'),
});

// 1. Faithfulness Evaluator
export const faithfulnessEvaluator = ai.defineFlow(
  {
    name: 'eval/faithfulness',
    inputSchema: z.object({
      context: z.array(z.string()),
      answer: z.string(),
    }),
    outputSchema: JudgeOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: googleAI.model('gemini-3.5-flash'),
      prompt: `
        You are an expert AI judge evaluating a RAG (Retrieval-Augmented Generation) system.
        Evaluate the FAITHFULNESS of the generated answer compared to the provided context.
        The answer is faithful ONLY if all statements in the answer can be directly inferred from the context.
        If the answer contains any facts not present in the context, rate it low.

        [Retrieved Context]:
        ${input.context.join('\n---\n')}

        [Generated Answer]:
        ${input.answer}

        Rate the faithfulness from 0.0 to 1.0. Provide a JSON response conforming to the output schema.
      `,
      output: { schema: JudgeOutputSchema },
    });
    return response.output!;
  }
);

// 2. Answer Relevance Evaluator
export const answerRelevanceEvaluator = ai.defineFlow(
  {
    name: 'eval/answerRelevance',
    inputSchema: z.object({
      query: z.string(),
      answer: z.string(),
    }),
    outputSchema: JudgeOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: googleAI.model('gemini-3.5-flash'),
      prompt: `
        You are an expert AI judge evaluating the RELEVANCE of a generated answer to a user's question.
        Evaluate whether the answer directly, clearly, and fully answers the question.
        If the answer is redundant, vague, or fails to address the prompt, rate it low.

        [User Question]:
        ${input.query}

        [Generated Answer]:
        ${input.answer}

        Rate the answer relevance from 0.0 to 1.0. Provide a JSON response conforming to the output schema.
      `,
      output: { schema: JudgeOutputSchema },
    });
    return response.output!;
  }
);

// 3. Context Relevance Evaluator
export const contextRelevanceEvaluator = ai.defineFlow(
  {
    name: 'eval/contextRelevance',
    inputSchema: z.object({
      query: z.string(),
      context: z.array(z.string()),
    }),
    outputSchema: JudgeOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      model: googleAI.model('gemini-3.5-flash'),
      prompt: `
        You are an expert AI judge evaluating the relevance of retrieved context documents to a user's question.
        Evaluate whether the retrieved context contains the information needed to answer the question.
        Rate high if the documents are highly precise and directly useful. Rate low if the context is irrelevant or noisy.

        [User Question]:
        ${input.query}

        [Retrieved Context]:
        ${input.context.join('\n---\n')}

        Rate the context relevance from 0.0 to 1.0. Provide a JSON response conforming to the output schema.
      `,
      output: { schema: JudgeOutputSchema },
    });
    return response.output!;
  }
);
