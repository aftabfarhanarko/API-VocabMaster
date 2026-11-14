import { DictionaryService } from './dictionary.service';
export declare class DictionaryController {
    private readonly dictionaryService;
    constructor(dictionaryService: DictionaryService);
    freeDictWordsList(page?: string, limit?: string): Promise<{
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
    freeDictLookup(word: string): Promise<import("./dictionary.service").FreeDictResponse | {
        message: string;
    }>;
    lookup(word: string): Promise<any>;
    rawEntries(word: string): Promise<any>;
    speak(text: string, accent?: 'US' | 'UK' | 'BN'): Promise<{
        audioUrl: string;
        text: string;
        accent: "US" | "UK" | "BN";
    }>;
}
