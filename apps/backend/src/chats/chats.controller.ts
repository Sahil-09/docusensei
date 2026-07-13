import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  UseGuards, Query,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ClerkAuthGuard, CurrentUser } from '../auth';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  create(
    @Body() createChatDto: CreateChatDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() currentUser: any,
  ) {
    return this.chatsService.create(createChatDto, files, currentUser);
  }

  @Post('embeddingTest')
  embeddingTest(@Query('text') text: string) {
    return this.chatsService.embeddingTest(text);
  }

  @Post('generateFromAi')
  generateFromAi(@Query('text') text: string) {
    return this.chatsService.generateFromAi(text);
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  findAll(@CurrentUser() currentUser: any) {
    return this.chatsService.findAll(currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  update(
    @Param('id') id: string,
    @Body() updateChatDto: UpdateChatDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() currentUser: any,
  ) {
    return this.chatsService.update(id, updateChatDto, files, currentUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatsService.remove(id);
  }
}
