import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VocabularyService } from './vocabulary.service';
import { WordFilterDto } from './dto/word-filter.dto';
import { CreateCustomWordDto } from './dto/create-custom-word.dto';
import { BulkBookmarkDto } from './dto/bulk-bookmark.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Vocabulary Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabService: VocabularyService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter 3,000+ words with pagination' })
  async findWords(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WordFilterDto
  ) {
    return this.vocabService.findWords(user.id, query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get list of categories with word counts' })
  async getCategories() {
    return this.vocabService.getCategories();
  }

  @Get('bookmarks')
  @ApiOperation({ summary: 'Get list of bookmarked/saved words in user book list' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'cefrLevel', required: false })
  async getBookmarkedWords(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('cefrLevel') cefrLevel?: string
  ) {
    return this.vocabService.getBookmarkedWords(user.id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      search,
      cefrLevel,
    });
  }

  @Post('bookmark/:wordId')
  @ApiOperation({ summary: 'Toggle bookmark on a word (save to/remove from book list)' })
  @ApiParam({ name: 'wordId', example: 'peace' })
  async toggleBookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Param('wordId') wordId: string
  ) {
    return this.vocabService.toggleBookmark(user.id, wordId);
  }

  @Delete('bookmark/:wordId')
  @ApiOperation({ summary: 'Remove a word from user book list' })
  @ApiParam({ name: 'wordId', example: 'peace' })
  async removeBookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Param('wordId') wordId: string
  ) {
    return this.vocabService.toggleBookmark(user.id, wordId);
  }

  @Post('bookmarks/bulk')
  @ApiOperation({ summary: 'Save multiple words to book list at once' })
  async bulkBookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkBookmarkDto
  ) {
    return this.vocabService.bulkBookmarkWords(user.id, dto.wordIds);
  }

  @Get(':wordOrId')
  @ApiOperation({ summary: 'Get detailed vocabulary entry by word or UUID' })
  @ApiParam({ name: 'wordOrId', example: 'serendipity' })
  async getWordDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('wordOrId') wordOrId: string
  ) {
    return this.vocabService.getWordDetails(wordOrId, user.id);
  }

  @Post('custom')
  @ApiOperation({ summary: 'Add a user custom word to personal vocabulary' })
  async createCustomWord(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCustomWordDto
  ) {
    return this.vocabService.createCustomWord(user.id, dto);
  }
}
