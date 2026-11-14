import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveNoteDto } from './dto/save-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async getNote(userId: string, wordId: string) {
    let actualWordId = wordId;
    const word = await this.prisma.vocabularyWord.findFirst({
      where: {
        OR: [{ id: wordId }, { normalizedWord: wordId.toLowerCase() }],
      },
    });
    if (word) actualWordId = word.id;

    return await this.prisma.wordNote.findUnique({
      where: {
        userId_wordId: { userId, wordId: actualWordId },
      },
    });
  }

  async saveNote(userId: string, wordId: string, dto: SaveNoteDto) {
    let actualWordId = wordId;
    const word = await this.prisma.vocabularyWord.findFirst({
      where: {
        OR: [{ id: wordId }, { normalizedWord: wordId.toLowerCase() }],
      },
    });

    if (word) {
      actualWordId = word.id;
    } else {
      throw new NotFoundException(`Word '${wordId}' not found in vocabulary.`);
    }

    return await this.prisma.wordNote.upsert({
      where: {
        userId_wordId: { userId, wordId: actualWordId },
      },
      create: {
        userId,
        wordId: actualWordId,
        content: dto.content,
        mnemonic: dto.mnemonic,
        personalExample: dto.personalExample,
      },
      update: {
        content: dto.content,
        mnemonic: dto.mnemonic,
        personalExample: dto.personalExample,
      },
    });
  }
}
