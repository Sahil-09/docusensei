import { IsNumberString, IsOptional, IsString } from 'class-validator';
export class CreateUserDto {
  @IsNumberString()
  clerkId: string;
  @IsString()
  email: string;
  @IsString()
  firstName: string;
  @IsString()
  lastName: string;
  @IsNumberString()
  @IsOptional()
  password: string;
}
