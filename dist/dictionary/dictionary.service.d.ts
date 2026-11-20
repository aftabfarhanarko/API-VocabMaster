import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
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
export type WordRelation = 'synonyms' | 'antonyms' | 'related' | 'topics' | 'rhymes';
export declare class DictionaryService {
    private readonly configService;
    private readonly redis;
    private readonly logger;
    private cache;
    private readonly cacheTtlMs;
    private readonly freeDictApiKey;
    private readonly freeDictBaseUrl;
    constructor(configService: ConfigService, redis: RedisService);
    listFreeDictWords(page?: number, limit?: number): Promise<{
        data: any[];
        meta: {
            count: number;
            offset: number;
            limit: number;
            has_more: boolean;
            page: number;
            source: string;
            unavailable: string;
        };
    } | {
        data: any;
        meta: {
            count: any;
            offset: any;
            limit: any;
            has_more: any;
            page: number;
            source: string;
            unavailable?: undefined;
        };
    }>;
    lookupFreeDict(word: string): Promise<FreeDictResponse | null>;
    lookupOpenDictionary(word: string): Promise<any | null>;
    lookupWord(word: string): Promise<any>;
    private getCached;
    private setCached;
    getRawEntries(word: string): Promise<any>;
    getRelatedWords(word: string, relation?: WordRelation, limit?: number): Promise<any>;
    getAudioUrl(text: string, accent?: 'US' | 'UK' | 'BN'): Promise<string>;
}
