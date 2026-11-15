import { PrismaService } from '../prisma/prisma.service';
import { SaveNoteDto } from './dto/save-note.dto';
export declare class NotesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getNote(userId: string, wordId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        wordId: string;
        mnemonic: string | null;
        personalExample: string | null;
    }>;
    saveNote(userId: string, wordId: string, dto: SaveNoteDto): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        wordId: string;
        mnemonic: string | null;
        personalExample: string | null;
    }>;
}
