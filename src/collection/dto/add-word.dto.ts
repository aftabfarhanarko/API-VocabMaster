import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddWordToCollectionDto {
  @ApiProperty({ description: 'Vocabulary word ID or word string', example: 'word-uuid-123' })
  @IsString()
  @IsNotEmpty()
  wordId: string;
}
