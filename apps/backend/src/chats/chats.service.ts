import { Injectable, Logger } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { UtilService } from '../shared/util.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentChunk, Prisma } from '../../generated/prisma/client';

@Injectable()
export class ChatsService {
  constructor(
    private readonly utilSer: UtilService,
    private readonly prisma: PrismaService,
  ) {}
  private logger = new Logger(ChatsService.name)
  async create(createChatDto: CreateChatDto, files, user) {
    const userData = await this.prisma.user.findUnique({where:{clerkId:user.id}})
    const createChat = await this.prisma.chat.create({
      data: { userId: userData.id },
    });
    this.logger.log(`Created chat with ID: ${createChat.id} for user: ${userData.id}`);
    const createMessage = await this.prisma.message.create({
      data: { chatId: createChat.id, role: 'USER', content: createChatDto.message },
    });
    this.logger.log(`Created initial message with ID: ${createMessage.id} for chat: ${createChat.id}`);
    await Promise.all(
      files.map(async (el) => {
        const pdfText =  await this.utilSer.parsePdf(el.buffer);
        const createdDoc = await this.prisma.document.create({
          data: {
            chatId: createChat.id,
            userId: userData.id,
            fileName: el.originalname,
            extractedText: pdfText.text,
            fileUrl:el.originalname
          },
        });
        this.logger.log(`Created document with ID: ${createdDoc.id} for chat: ${createChat.id}`);
        const embedded = await this.utilSer.embedText(pdfText.text);
        const createDocChunk = await this.prisma.documentChunk.create({
          data: {
            documentId: createdDoc.id,
            content: pdfText.text,
          },
        });
        this.logger.log(`Created document chunk with ID: ${createDocChunk.id} for document: ${createdDoc.id}`);
        const embeddingArray = embedded[0].embedding;
        const embeddingString = `[${embeddingArray.map(v => {
          const num = Number(v);
          return isFinite(num) ? num : 0;
        }).join(',')}]`;
        const updateQuery = `UPDATE "document_chunks" SET "embedding" = '${embeddingString}'::vector WHERE "id" = '${createDocChunk.id}'`;
        await this.prisma.$executeRawUnsafe(updateQuery);
        this.logger.log(`Updated embedding for document chunk with ID: ${createDocChunk.id}`);
      }),
    );
    return { message : 'Created',chatId:createChat.id};
  }

  async embeddingTest() {
    const placeHolderText = 'nestjs';
    const embedding = await this.utilSer.embedText(placeHolderText);

    const embeddingArray = embedding[0].embedding;
    const embeddingString = `[${embeddingArray.map(v => {
      const num = Number(v);
      return isFinite(num) ? num : 0;
    }).join(',')}]`;

    const query = `SELECT id, "documentId", content, metadata, "createdAt" FROM "document_chunks" ORDER BY embedding <=> '${embeddingString}'::vector LIMIT 5`;
    const docs = await this.prisma.$queryRawUnsafe<DocumentChunk[]>(query);
    this.logger.debug(
      `Similarity search for "${placeHolderText}" returned ${docs?.length} rows`,
    );
    return docs;
  }

  findAll() {
    return `This action returns all chats`;
  }

  findOne(id: string) {
    return this.prisma.message.findMany({where: {chatId: id}});
  }

  update(id: string, updateChatDto: UpdateChatDto) {
    return this.prisma.message.create({
      data: {
        chatId: id,
        role: updateChatDto.role == 'ASSISTANT' ? 'ASSISTANT' : 'USER',
        content: updateChatDto.message,
      },
    });
  }

  remove(id: string) {
    return `This action removes a #${id} chat`;
  }
}
