import { PDFParse } from 'pdf-parse';
import { Injectable } from '@nestjs/common';
import { genkit } from 'genkit';
import { googleAI, vertexAI } from '@genkit-ai/google-genai';

@Injectable()
export class UtilService{
  constructor() {
  }

  async parsePdf(buffer){
    const parser = new PDFParse({ data: buffer });
    let result = await parser.getText()
    await parser.destroy();
    return result;
  }

  async embedText(text: string){
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

  async generateFromAi(text:string){
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
}
