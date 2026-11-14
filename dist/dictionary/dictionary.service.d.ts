import { ConfigService } from '@nestjs/config';
export interface FreeDictResponse {
    word: string;
    slug: string;
    pos: string[];
    definitionShort: string;
    definitions: Array<{
        pos: string;
        sense: string;
        register?: string | null;
    }>;
    pronunciationIpa?: string;
    respelling?: string;
    cefrLevel?: string;
    bengaliMeaning?: string;
    bengaliRomanised?: string;
    translations?: any[];
    source: string;
}
export declare class DictionaryService {
    private readonly configService;
    private readonly logger;
    private cache;
    private readonly freeDictApiKey;
    private readonly freeDictBaseUrl;
    constructor(configService: ConfigService);
    listFreeDictWords(page?: number, limit?: number): Promise<{
        data: any;
        meta: {
            count: any;
            offset: any;
            limit: any;
            has_more: any;
            page: number;
            source: string;
        };
    }>;
    lookupFreeDict(word: string): Promise<FreeDictResponse | null>;
    lookupOpenDictionary(word: string): Promise<any | null>;
    lookupWord(word: string): Promise<any>;
    getRawEntries(word: string): Promise<any>;
    getAudioUrl(text: string, accent?: 'US' | 'UK' | 'BN'): Promise<string>;
}
