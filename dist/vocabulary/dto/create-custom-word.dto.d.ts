import { CefrLevel, PartOfSpeech } from '@vocabmaster/shared';
declare class ExampleDto {
    sentenceEn: string;
    sentenceBn: string;
}
export declare class CreateCustomWordDto {
    word: string;
    partOfSpeech: PartOfSpeech;
    cefrLevel?: CefrLevel;
    category?: string;
    englishMeaning: string;
    banglaMeaning: string;
    phoneticUs?: string;
    phoneticUk?: string;
    examples?: ExampleDto[];
    synonyms?: string[];
    antonyms?: string[];
}
export {};
