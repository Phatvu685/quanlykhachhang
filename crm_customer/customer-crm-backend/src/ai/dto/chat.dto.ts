import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  role: 'user' | 'model' | 'assistant';

  @IsString()
  content: string;
}

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsArray()
  history?: ChatMessageDto[];

  @IsOptional()
  @IsString()
  apiKey?: string;
}
