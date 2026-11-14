import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveNoteDto {
  @ApiPropertyOptional({ example: 'Associated with serenity...' })
  @IsOptional()
  @IsString()
  mnemonic?: string;

  @ApiProperty({ example: 'Personal notes on usage...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'My personal sample sentence...' })
  @IsOptional()
  @IsString()
  personalExample?: string;
}
