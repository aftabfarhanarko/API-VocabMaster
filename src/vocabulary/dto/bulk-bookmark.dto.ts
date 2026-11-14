import { IsArray, ArrayMinSize, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkBookmarkDto {
  @ApiProperty({
    description: 'Array of word IDs or word strings to save to book list / bookmarks',
    example: ['peace', 'serendipity'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  wordIds: string[];
}
