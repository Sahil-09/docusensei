import { PartialType } from '@nestjs/mapped-types';
import { CreateChatDto } from './create-chat.dto';
import { IsString } from 'class-validator';

export class UpdateChatDto extends PartialType(CreateChatDto) {
  @IsString()
  role:string
}
