import { PDFParse } from 'pdf-parse';
import { Injectable } from '@nestjs/common';
import { genkit } from 'genkit';
import { googleAI, vertexAI } from '@genkit-ai/google-genai';
import * as fs from 'fs';
import * as path from 'path';
import { genericFlow } from '../genkit/genericFlow';
import {
  faithfulnessEvaluator,
  answerRelevanceEvaluator,
  contextRelevanceEvaluator,
} from '../genkit/evaluators';

@Injectable()
export class UtilService {
  constructor() {}

  async parsePdf(buffer) {
    const parser = new PDFParse({ data: buffer });
    let result = await parser.getText();
    await parser.destroy();
    return result;
  }

  async embedText(text: string) {
    const ai = genkit({
      plugins: [vertexAI()],
    });
    return ai.embed({
      embedder: vertexAI.embedder('text-embedding-004'),
      content: text,
      options: {
        outputDimensionality: 384, // Reduce from 768 to 384                                                                                                                                                                                                         MCP
      },
    });
  }

  async generateFromAi(text: string) {
    const ai = genkit({
      plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
      model: googleAI.model('gemini-3.5-flash'),
    });
    const response = await ai.generate(
      `Prepare a short title for the conversation, based on question user have asked, no any option just keep it short and direct title
      Question:${text}`,
    );
    return response.text;
  }

  async createTextChunk(text: string, BATCH_SIZE: number) {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += BATCH_SIZE) {
      chunks.push(text.slice(i, i + BATCH_SIZE));
    }
    return chunks;
  }

  async runEvalSuite() {
    const testChatId = 'cmrqj6a5j00007wek69e0on4c'; // Chat ID with uploaded document reference
    const datasetPath = path.join(__dirname,'assets' , 'datasets', 'ddia.json');
    if (!fs.existsSync(datasetPath)) {
      console.error(
        `Dataset not found at ${datasetPath}. Please ensure ddia.json is present.`,
      );
      return;
    }

    const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

    console.log(
      `🚀 Starting RAG Eval Suite over ${dataset.length} test cases...\n`,
    );

    const results: any[] = [];
    let totalFaithfulness = 0;
    let totalAnswerRelevance = 0;
    let totalContextRelevance = 0;

    for (const item of dataset) {
      const query = item.questions || item.question;
      if (!query) continue;

      console.log(`Evaluating Question: "${query}"`);

      // 1. Run RAG Pipeline in Evaluation Mode
      const ragResult = await genericFlow({
        message: query,
        chatId: testChatId,
        inputMessageId: '',
        isEval: true,
      });

      const generatedAnswer = ragResult.text;
      const retrievedDocs = ragResult.retrievedDocs || [];

      // 2. Run Evaluators in Parallel
      const [faithfulness, answerRelevance, contextRelevance] =
        await Promise.all([
          faithfulnessEvaluator({
            context: retrievedDocs,
            answer: generatedAnswer,
          }),
          answerRelevanceEvaluator({ query, answer: generatedAnswer }),
          contextRelevanceEvaluator({ query, context: retrievedDocs }),
        ]);

      totalFaithfulness += faithfulness.score;
      totalAnswerRelevance += answerRelevance.score;
      totalContextRelevance += contextRelevance.score;

      results.push({
        question: query,
        generatedAnswer,
        retrievedContextLength: retrievedDocs.length,
        retrievedDocs,
        metrics: {
          faithfulness: {
            score: faithfulness.score,
            reason: faithfulness.reason,
          },
          answerRelevance: {
            score: answerRelevance.score,
            reason: answerRelevance.reason,
          },
          contextRelevance: {
            score: contextRelevance.score,
            reason: contextRelevance.reason,
          },
        },
      });

      console.log(
        `   └─ Faithfulness: ${faithfulness.score} (${faithfulness.reason})`,
      );
      console.log(
        `   └─ Answer Relevance: ${answerRelevance.score} (${answerRelevance.reason})`,
      );
      console.log(
        `   └─ Context Relevance: ${contextRelevance.score} (${contextRelevance.reason})\n`,
      );
    }

    const count = results.length || 1;
    const report = {
      evaluatedAt: new Date().toISOString(),
      chatId: testChatId,
      averageMetrics: {
        faithfulness: totalFaithfulness / count,
        answerRelevance: totalAnswerRelevance / count,
        contextRelevance: totalContextRelevance / count,
      },
      detailedResults: results,
    };

    // const reportPath = path.join(__dirname, 'report.json');
    // fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Evaluation complete! Average metrics:`);
    console.log(
      `📊 Faithfulness: ${(report.averageMetrics.faithfulness * 100).toFixed(1)}%`,
    );
    console.log(
      `📊 Answer Relevance: ${(report.averageMetrics.answerRelevance * 100).toFixed(1)}%`,
    );
    console.log(
      `📊 Context Relevance: ${(report.averageMetrics.contextRelevance * 100).toFixed(1)}%`,
    );
    // console.log(`\nDetailed report written to: ${reportPath}`);
    return report
  }
}
