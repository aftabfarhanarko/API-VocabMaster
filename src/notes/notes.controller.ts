import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { SaveNoteDto } from './dto/save-note.dto';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

@ApiTags('Word Notes & Mnemonics')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get(':wordId')
  @ApiOperation({ summary: 'Get user personal note and mnemonic for a word' })
  async getNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('wordId') wordId: string
  ) {
    return this.notesService.getNote(user.id, wordId);
  }

  @Post(':wordId')
  @ApiOperation({ summary: 'Save or update user personal note and mnemonic for a word' })
  async saveNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('wordId') wordId: string,
    @Body() dto: SaveNoteDto
  ) {
    return this.notesService.saveNote(user.id, wordId, dto);
  }
}
