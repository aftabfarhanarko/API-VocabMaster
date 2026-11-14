import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CefrLevel, PartOfSpeech } from '@vocabmaster/shared';

class ExampleDto {
  @ApiProperty({ example: 'The scientist observed the stars at night.' })
  @IsString()
  @IsNotEmpty()
  sentenceEn: string;

  @ApiProperty({ example: 'বিজ্ঞানী রাতে তারাগুলো পর্যবেক্ষণ করেছিলেন।' })
  @IsString()
  @IsNotEmpty()
  sentenceBn: string;
}

export class CreateCustomWordDto {
  @ApiProperty({ example: 'ephemeral' })
  @IsString()
  @IsNotEmpty()
  word: string;

  @ApiProperty({ enum: PartOfSpeech, example: PartOfSpeech.ADJECTIVE })
  @IsEnum(PartOfSpeech)
  partOfSpeech: PartOfSpeech;

  @ApiPropertyOptional({ enum: CefrLevel, example: CefrLevel.C1 })
  @IsOptional()
  @IsEnum(CefrLevel)
  cefrLevel?: CefrLevel;

  @ApiPropertyOptional({ example: 'Academic & Education' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'Lasting for a very short time.' })
  @IsString()
  @IsNotEmpty()
  englishMeaning: string;

  @ApiProperty({ example: 'ক্ষণস্থায়ী বা স্বল্পস্থায়ী।' })
  @IsString()
  @IsNotEmpty()
  banglaMeaning: string;

  @ApiPropertyOptional({ example: '/ɪˈfem.ər.əl/' })
  @IsOptional()
  @IsString()
  phoneticUs?: string;

  @ApiPropertyOptional({ example: '/ɪˈfem.ər.əl/' })
  @IsOptional()
  @IsString()
  phoneticUk?: string;

  @ApiPropertyOptional({ type: [ExampleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExampleDto)
  examples?: ExampleDto[];

  @ApiPropertyOptional({ example: ['fleeting', 'transient'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];

  @ApiPropertyOptional({ example: ['permanent', 'enduring'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  antonyms?: string[];
}
