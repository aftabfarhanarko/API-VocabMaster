import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddWordToCollectionDto } from './dto/add-word.dto';
import { AuthenticatedUser } from '../auth/current-user.decorator';
export declare class CollectionController {
    private readonly collectionService;
    constructor(collectionService: CollectionService);
    getCollections(user: AuthenticatedUser): Promise<{
        wordCount: number;
        _count: {
            items: number;
        };
        description: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        color: string | null;
        icon: string | null;
        isPublic: boolean;
    }[]>;
    createCollection(user: AuthenticatedUser, dto: CreateCollectionDto): Promise<{
        _count: {
            items: number;
        };
    } & {
        description: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        color: string | null;
        icon: string | null;
        isPublic: boolean;
    }>;
    getCollectionById(user: AuthenticatedUser, id: string): Promise<{
        words: ({
            examples: {
                id: string;
                createdAt: Date;
                source: string | null;
                sentenceEn: string;
                sentenceBn: string;
                wordId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            word: string;
            frequencyScore: number;
            synonyms: string[];
            antonyms: string[];
            cefrLevel: import(".prisma/client").$Enums.CefrLevel | null;
            category: string;
            partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
            englishMeaning: string;
            banglaMeaning: string;
            phoneticUs: string | null;
            phoneticUk: string | null;
            normalizedWord: string;
            audioUkUrl: string | null;
            audioUsUrl: string | null;
            etymology: string | null;
            dictionarySource: string | null;
            englishContext: string | null;
            banglaContext: string | null;
            isSystemWord: boolean;
            createdById: string | null;
        })[];
        wordCount: number;
        items: ({
            word: {
                examples: {
                    id: string;
                    createdAt: Date;
                    source: string | null;
                    sentenceEn: string;
                    sentenceBn: string;
                    wordId: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                word: string;
                frequencyScore: number;
                synonyms: string[];
                antonyms: string[];
                cefrLevel: import(".prisma/client").$Enums.CefrLevel | null;
                category: string;
                partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
                englishMeaning: string;
                banglaMeaning: string;
                phoneticUs: string | null;
                phoneticUk: string | null;
                normalizedWord: string;
                audioUkUrl: string | null;
                audioUsUrl: string | null;
                etymology: string | null;
                dictionarySource: string | null;
                englishContext: string | null;
                banglaContext: string | null;
                isSystemWord: boolean;
                createdById: string | null;
            };
        } & {
            id: string;
            collectionId: string;
            wordId: string;
            addedAt: Date;
        })[];
        description: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        color: string | null;
        icon: string | null;
        isPublic: boolean;
    }>;
    updateCollection(user: AuthenticatedUser, id: string, dto: UpdateCollectionDto): Promise<{
        description: string | null;
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        color: string | null;
        icon: string | null;
        isPublic: boolean;
    }>;
    deleteCollection(user: AuthenticatedUser, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    addWord(user: AuthenticatedUser, id: string, dto: AddWordToCollectionDto): Promise<{
        success: boolean;
        collectionId: string;
        wordId: string;
        item: {
            word: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                word: string;
                frequencyScore: number;
                synonyms: string[];
                antonyms: string[];
                cefrLevel: import(".prisma/client").$Enums.CefrLevel | null;
                category: string;
                partOfSpeech: import(".prisma/client").$Enums.PartOfSpeech;
                englishMeaning: string;
                banglaMeaning: string;
                phoneticUs: string | null;
                phoneticUk: string | null;
                normalizedWord: string;
                audioUkUrl: string | null;
                audioUsUrl: string | null;
                etymology: string | null;
                dictionarySource: string | null;
                englishContext: string | null;
                banglaContext: string | null;
                isSystemWord: boolean;
                createdById: string | null;
            };
        } & {
            id: string;
            collectionId: string;
            wordId: string;
            addedAt: Date;
        };
    }>;
    removeWord(user: AuthenticatedUser, id: string, wordId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
