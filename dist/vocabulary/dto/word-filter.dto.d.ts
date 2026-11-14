import { CefrLevel, PartOfSpeech, SrsState } from '@vocabmaster/shared';
export declare class WordFilterDto {
    search?: string;
    cefrLevel?: CefrLevel;
    category?: string;
    partOfSpeech?: PartOfSpeech;
    srsState?: SrsState;
    collectionId?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    source?: 'database' | 'freedict';
}
