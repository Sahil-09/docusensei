import { IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  chatId: string;
}
