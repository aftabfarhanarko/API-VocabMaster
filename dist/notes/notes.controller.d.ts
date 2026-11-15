import { NotesService } from './notes.service';
import { SaveNoteDto } from './dto/save-note.dto';
import { AuthenticatedUser } from '../auth/current-user.decorator';
export declare class NotesController {
    private readonly notesService;
    constructor(notesService: NotesService);
    getNote(user: AuthenticatedUser, wordId: string): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        wordId: string;
        mnemonic: string | null;
        personalExample: string | null;
    }>;
    saveNote(user: AuthenticatedUser, wordId: string, dto: SaveNoteDto): Promise<{
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
