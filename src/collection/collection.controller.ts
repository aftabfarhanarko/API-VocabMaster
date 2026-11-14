import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddWordToCollectionDto } from './dto/add-word.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Personal Collections')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all personal collections for the current user' })
  async getCollections(@CurrentUser() user: AuthenticatedUser) {
    return this.collectionService.getUserCollections(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new personal vocabulary collection/deck' })
  async createCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCollectionDto
  ) {
    return this.collectionService.createCollection(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collection details and all contained vocabulary words' })
  async getCollectionById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.collectionService.getCollectionById(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update collection details' })
  async updateCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto
  ) {
    return this.collectionService.updateCollection(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a personal collection' })
  async deleteCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.collectionService.deleteCollection(user.id, id);
  }

  @Post(':id/words')
  @ApiOperation({ summary: 'Add a vocabulary word to a collection' })
  async addWord(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddWordToCollectionDto
  ) {
    return this.collectionService.addWordToCollection(user.id, id, dto.wordId);
  }

  @Delete(':id/words/:wordId')
  @ApiOperation({ summary: 'Remove a word from a collection' })
  async removeWord(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('wordId') wordId: string
  ) {
    return this.collectionService.removeWordFromCollection(user.id, id, wordId);
  }
}
