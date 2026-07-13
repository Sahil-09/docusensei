import { Injectable, Logger } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { UtilService } from '../shared/util.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentChunk } from '../../generated/prisma/client';
import { indexData } from '../genkit/indexerFlow';

@Injectable()
export class ChatsService {
  constructor(
    private readonly utilSer: UtilService,
    private readonly prisma: PrismaService,
  ) {}
  private logger = new Logger(ChatsService.name);

  async create(createChatDto: CreateChatDto, files, user) {
    const userData = await this.prisma.user.findUnique({
      where: { clerkId: user.id },
    });
    if (!userData) {
      throw new Error(`User with clerkId ${user.id} not found`);
    }
    let title=''
    if(!createChatDto.chatId){
      title = await this.utilSer.generateFromAi(createChatDto.message)
    }
    const createChat = await this.prisma.chat.upsert({
      where: { id: createChatDto.chatId },
      create: { userId: userData.id, title },
      update: { userId: userData.id },
    });
    this.logger.log(
      `Created chat with ID: ${createChat.id} for user: ${userData.id}`,
    );
    const createMessage = await this.prisma.message.create({
      data: {
        chatId: createChat.id,
        role: 'USER',
        content: createChatDto.message,
      },
    });
    this.logger.log(
      `Created initial message with ID: ${createMessage.id} for chat: ${createChat.id}`,
    );
    if (files.length) await this.updatedDoc(createChat.id, userData.id, files);
    return {
      message: 'Created',
      chatId: createChat.id,
      messageId: createMessage.id,
    };
  }

  async embeddingTest(text) {
    const embedding = await this.utilSer.embedText(text);

    const embeddingArray = embedding[0].embedding;
    const embeddingString = `[${embeddingArray
      .map((v) => {
        const num = Number(v);
        return isFinite(num) ? num : 0;
      })
      .join(',')}]`;

    const docs = (await this.prisma.$queryRawUnsafe(
      `SELECT id, "documentId", content, metadata, "createdAt" FROM "document_chunks" ORDER BY embedding <=> '${embeddingString}'::vector LIMIT 5`,
    )) as DocumentChunk[];

    this.logger.debug(
      `Similarity search for "${text}" returned ${docs?.length} rows`,
    );
    return docs;
  }

  async findAll(user) {
    const userData= await this.prisma.user.findUnique({where:{clerkId:user.id}})
    return this.prisma.chat.findMany({ where: { userId: userData.id } });
  }

  findOne(id: string) {
    return this.prisma.message.findMany({ where: { chatId: id } });
  }

  async update(chatId: string, updateChatDto: UpdateChatDto, files, user) {
    const userData = await this.prisma.user.findUnique({
      where: { clerkId: user.id },
    });
    this.logger.log(`Created chat with ID: ${chatId} for user: ${userData.id}`);
    const createMessage = await this.prisma.message.create({
      data: {
        chatId,
        role: 'USER',
        content: updateChatDto.message,
      },
    });
    this.logger.log(
      `Created initial message with ID: ${createMessage.id} for chat: ${chatId}`,
    );
    await this.updatedDoc(chatId, userData.id, files);
    return {
      message: 'Updated',
      chatId: chatId,
      messageId: createMessage.id,
    };
  }

  remove(id: string) {
    return `This action removes a #${id} chat`;
  }

  async updatedDoc(chatId, userId, files) {
    await Promise.all(
      files?.map(async (el) => {
        const pdfText = await this.utilSer.parsePdf(el.buffer);
        const createdDoc = await this.prisma.document.create({
          data: {
            chatId,
            userId,
            fileName: el.originalname,
            extractedText: pdfText.text,
            fileUrl: el.originalname,
          },
        });
        this.logger.log(
          `Created document with ID: ${createdDoc.id} for chat: ${chatId}`,
        );
        await indexData.run({ file: el, docId: createdDoc.id });
      }),
    );
  }

  async generateFromAi(text){
    return this.utilSer.generateFromAi(text)
  }
}
