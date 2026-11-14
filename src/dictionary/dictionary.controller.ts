import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DictionaryService } from './dictionary.service';

@ApiTags('Dictionary & Translations')
@Controller()
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('dictionary/freedict/words')
  @ApiOperation({
    summary:
      'Direct paginated words feed from FreeDict API with Bengali translations & CEFR levels',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async freeDictWordsList(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    return await this.dictionaryService.listFreeDictWords(pageNum, limitNum);
  }

  @Get('dictionary/freedict/:word')
  @ApiOperation({
    summary: 'Direct lookup via FreeDict API with authentic Bengali translations and CEFR level',
  })
  @ApiParam({ name: 'word', example: 'peace' })
  async freeDictLookup(@Param('word') word: string) {
    const data = await this.dictionaryService.lookupFreeDict(word);
    return data || { message: `No FreeDict entry found for '${word}'` };
  }

  @Get('dictionary/lookup/:word')
  @ApiOperation({
    summary:
      'Unified dictionary lookup combining FreeDict (Bengali translations + CEFR) and audio phonetics',
  })
  @ApiParam({ name: 'word', example: 'peace' })
  async lookup(@Param('word') word: string) {
    const data = await this.dictionaryService.lookupWord(word);
    return data || { message: `No definition found for '${word}'` };
  }

  @Get('dictionary/raw/:word')
  @ApiOperation({
    summary:
      'Direct raw OpenDictionary array payload matching https://api.opendictionaryapi.com/entries/en/:word',
  })
  @ApiParam({ name: 'word', example: 'hello' })
  async rawEntries(@Param('word') word: string) {
    const raw = await this.dictionaryService.getRawEntries(word);
    return raw || [];
  }

  @Get('tts/speak')
  @ApiOperation({ summary: 'Get fallback audio pronunciation URL for English or Bengali' })
  @ApiQuery({ name: 'text', example: 'peace' })
  @ApiQuery({ name: 'accent', enum: ['US', 'UK', 'BN'], required: false })
  async speak(
    @Query('text') text: string,
    @Query('accent') accent: 'US' | 'UK' | 'BN' = 'US'
  ) {
    const audioUrl = await this.dictionaryService.getAudioUrl(text, accent);
    return { audioUrl, text, accent };
  }
}
