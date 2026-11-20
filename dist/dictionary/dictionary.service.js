"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DictionaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DictionaryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../redis/redis.service");
const axios_1 = __importDefault(require("axios"));
let DictionaryService = DictionaryService_1 = class DictionaryService {
    configService;
    redis;
    logger = new common_1.Logger(DictionaryService_1.name);
    cache = new Map();
    cacheTtlMs = 60 * 60 * 1000;
    freeDictApiKey;
    freeDictBaseUrl;
    constructor(configService, redis) {
        this.configService = configService;
        this.redis = redis;
        this.freeDictApiKey =
            this.configService.get('FREEDICT_API_KEY') || '';
        this.freeDictBaseUrl =
            this.configService.get('FREEDICT_API_URL') || 'https://freedict.com/api/v1';
    }
    async listFreeDictWords(page = 1, limit = 20) {
        const offset = Math.max(0, (page - 1) * limit);
        const safeLimit = Math.min(100, Math.max(1, limit));
        if (!this.freeDictApiKey) {
            return {
                data: [],
                meta: {
                    count: 0,
                    offset,
                    limit: safeLimit,
                    has_more: false,
                    page,
                    source: 'FreeDict API',
                    unavailable: 'FREEDICT_API_KEY is not configured',
                },
            };
        }
        try {
            const response = await axios_1.default.get(`${this.freeDictBaseUrl}/words`, {
                params: {
                    locale: 'en-US',
                    include: 'translations',
                    limit: safeLimit,
                    offset,
                },
                headers: {
                    'X-API-Key': this.freeDictApiKey,
                },
                timeout: 10000,
            });
            const data = response.data?.data;
            if (!data || !Array.isArray(data.words)) {
                return {
                    data: [],
                    meta: {
                        count: 0,
                        offset,
                        limit: safeLimit,
                        has_more: false,
                        page,
                        source: 'FreeDict API',
                    },
                };
            }
            const formatted = data.words.map((w) => {
                const bnTrans = w.translations?.find((t) => t.code === 'bn');
                const bengaliMeaning = bnTrans?.words?.map((bw) => bw.word).join(', ') || null;
                const bengaliRomanised = bnTrans?.words?.map((bw) => bw.romanised).filter(Boolean).join(', ') || null;
                return {
                    word: w.word,
                    slug: w.slug,
                    length: w.length,
                    partOfSpeech: w.pos?.[0]?.toUpperCase() || 'NOUN',
                    allPartsOfSpeech: w.pos || [],
                    cefrLevel: w.cefr_level ? w.cefr_level.toUpperCase() : 'B1',
                    definition: w.definition,
                    banglaMeaning: bengaliMeaning,
                    banglaRomanised: bengaliRomanised,
                    frequencyRank: w.frequency_rank,
                    syllables: w.syllables,
                    source: 'FreeDict API',
                };
            });
            return {
                data: formatted,
                meta: {
                    count: data.count,
                    offset: data.offset,
                    limit: data.limit,
                    has_more: data.has_more,
                    page,
                    source: 'FreeDict API',
                },
            };
        }
        catch (err) {
            this.logger.error(`Error fetching words list from FreeDict: ${err.message}`);
            throw err;
        }
    }
    async lookupFreeDict(word) {
        const normalized = word.trim().toLowerCase();
        const cacheKey = `freedict:${normalized}`;
        const cached = await this.getCached(cacheKey);
        if (cached)
            return cached;
        if (!this.freeDictApiKey)
            return null;
        try {
            const response = await axios_1.default.get(`${this.freeDictBaseUrl}/words/${encodeURIComponent(normalized)}`, {
                params: {
                    locale: 'en-US',
                    include: 'translations',
                },
                headers: {
                    'X-API-Key': this.freeDictApiKey,
                },
                timeout: 6000,
            });
            const data = response.data?.data;
            if (!data)
                return null;
            let bengaliMeaning;
            let bengaliRomanised;
            if (Array.isArray(data.translations)) {
                const bnTrans = data.translations.find((t) => t.code === 'bn' || t.language?.toLowerCase() === 'bengali');
                if (bnTrans?.words && Array.isArray(bnTrans.words)) {
                    bengaliMeaning = bnTrans.words.map((w) => w.word).join(', ');
                    bengaliRomanised = bnTrans.words
                        .map((w) => w.romanised)
                        .filter(Boolean)
                        .join(', ');
                }
            }
            const result = {
                word: data.word,
                slug: data.slug,
                pos: Array.isArray(data.pos) ? data.pos : [data.pos || 'noun'],
                definitionShort: data.definition_short || '',
                definitions: Array.isArray(data.definitions)
                    ? data.definitions.map((d) => ({
                        pos: d.pos || 'noun',
                        sense: d.sense || '',
                        register: d.register || null,
                    }))
                    : [],
                pronunciationIpa: data.pronunciation_ipa,
                respelling: data.respelling,
                cefrLevel: data.cefr_level ? data.cefr_level.toUpperCase() : undefined,
                bengaliMeaning,
                bengaliRomanised,
                translations: data.translations || [],
                source: 'FreeDict API',
            };
            await this.setCached(cacheKey, result);
            return result;
        }
        catch (err) {
            this.logger.debug(`FreeDict lookup error for '${word}': ${err.message}`);
            return null;
        }
    }
    async lookupOpenDictionary(word) {
        const normalized = word.trim().toLowerCase();
        const endpoints = [
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`,
        ];
        for (const url of endpoints) {
            try {
                const response = await axios_1.default.get(url, { timeout: 5000 });
                if (Array.isArray(response.data) && response.data.length > 0) {
                    return response.data;
                }
            }
            catch { }
        }
        return null;
    }
    async lookupWord(word) {
        const normalized = word.trim().toLowerCase();
        const cached = await this.getCached(normalized);
        if (cached)
            return cached;
        const freeDictData = await this.lookupFreeDict(normalized);
        const openDictRaw = await this.lookupOpenDictionary(normalized);
        const openEntry = openDictRaw?.[0];
        let phoneticUs = freeDictData?.pronunciationIpa || null;
        let phoneticUk = freeDictData?.pronunciationIpa || null;
        let audioUsUrl = null;
        let audioUkUrl = null;
        const synonyms = new Set();
        const antonyms = new Set();
        const definitions = [];
        if (openEntry) {
            if (Array.isArray(openEntry.phonetics)) {
                for (const p of openEntry.phonetics) {
                    if (p.text && !phoneticUs)
                        phoneticUs = p.text;
                    if (p.audio) {
                        if (p.audio.includes('-us.') || p.audio.includes('en-us')) {
                            audioUsUrl = p.audio;
                            if (p.text)
                                phoneticUs = p.text;
                        }
                        else if (p.audio.includes('-uk.') || p.audio.includes('en-uk')) {
                            audioUkUrl = p.audio;
                            if (p.text)
                                phoneticUk = p.text;
                        }
                        else if (!audioUsUrl) {
                            audioUsUrl = p.audio;
                        }
                    }
                }
            }
            if (Array.isArray(openEntry.meanings)) {
                for (const m of openEntry.meanings) {
                    const partOfSpeech = m.partOfSpeech?.toUpperCase() || 'NOUN';
                    for (const d of m.definitions || []) {
                        definitions.push({
                            partOfSpeech,
                            definition: d.definition,
                            example: d.example || null,
                        });
                        if (Array.isArray(d.synonyms)) {
                            d.synonyms.forEach((s) => synonyms.add(s));
                        }
                        if (Array.isArray(d.antonyms)) {
                            d.antonyms.forEach((a) => antonyms.add(a));
                        }
                    }
                }
            }
        }
        if (definitions.length === 0 && freeDictData) {
            definitions.push({
                partOfSpeech: freeDictData.pos[0]?.toUpperCase() || 'NOUN',
                definition: freeDictData.definitionShort,
                example: null,
            });
            for (const def of freeDictData.definitions) {
                definitions.push({
                    partOfSpeech: def.pos?.toUpperCase() || 'NOUN',
                    definition: def.sense,
                    example: null,
                });
            }
        }
        const result = {
            word: freeDictData?.word || openEntry?.word || normalized,
            phonetic: phoneticUs || phoneticUk || freeDictData?.pronunciationIpa,
            phoneticUs,
            phoneticUk,
            audioUsUrl,
            audioUkUrl,
            cefrLevel: freeDictData?.cefrLevel || null,
            etymology: openEntry?.origin || null,
            bengaliMeaning: freeDictData?.bengaliMeaning || null,
            bengaliRomanised: freeDictData?.bengaliRomanised || null,
            definitions,
            synonyms: Array.from(synonyms).slice(0, 10),
            antonyms: Array.from(antonyms).slice(0, 10),
            freeDict: freeDictData,
            raw: openDictRaw,
        };
        await this.setCached(normalized, result);
        return result;
    }
    async getCached(key) {
        const shared = await this.redis.get(`vocab:dictionary:v1:${key}`);
        if (shared) {
            try {
                return JSON.parse(shared);
            }
            catch { }
        }
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        if (entry.expiresAt <= Date.now()) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.value;
    }
    async setCached(key, value) {
        if (this.cache.size >= 500) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey)
                this.cache.delete(oldestKey);
        }
        this.cache.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
        await this.redis.set(`vocab:dictionary:v1:${key}`, JSON.stringify(value), this.cacheTtlMs / 1000);
    }
    async getRawEntries(word) {
        const raw = await this.lookupOpenDictionary(word);
        return raw || [];
    }
    async getRelatedWords(word, relation = 'related', limit = 10) {
        const normalized = word.trim().toLowerCase();
        if (!/^[a-z][a-z' -]{0,79}$/i.test(normalized)) {
            throw new common_1.BadRequestException('Word must contain only letters, spaces, apostrophes, or hyphens.');
        }
        const safeLimit = Math.min(20, Math.max(1, limit));
        const cacheKey = `datamuse:${relation}:${normalized}:${safeLimit}`;
        const cached = await this.getCached(cacheKey);
        if (cached)
            return cached;
        const relationParams = {
            synonyms: 'rel_syn',
            antonyms: 'rel_ant',
            related: 'ml',
            rhymes: 'rel_rhy',
        };
        try {
            const response = await axios_1.default.get('https://api.datamuse.com/words', {
                params: relation === 'topics'
                    ? { ml: normalized, topics: normalized, max: safeLimit }
                    : { [relationParams[relation]]: normalized, max: safeLimit },
                timeout: 4000,
                headers: { 'User-Agent': 'VocabMaster/1.0 (dictionary related-words)' },
            });
            const results = Array.isArray(response.data)
                ? response.data
                    .filter((entry) => typeof entry?.word === 'string')
                    .slice(0, safeLimit)
                    .map((entry) => ({ word: entry.word, score: entry.score ?? null }))
                : [];
            const result = {
                word: normalized,
                relation,
                data: results,
                source: 'Datamuse',
                attribution: 'Related word suggestions provided by Datamuse API',
            };
            await this.setCached(cacheKey, result);
            return result;
        }
        catch (error) {
            this.logger.warn(`Datamuse lookup failed for '${normalized}': ${error.message}`);
            return {
                word: normalized,
                relation,
                data: [],
                source: 'Datamuse',
                unavailable: true,
            };
        }
    }
    async getAudioUrl(text, accent = 'US') {
        const lang = accent === 'BN' ? 'bn' : accent === 'UK' ? 'en-GB' : 'en-US';
        return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    }
};
exports.DictionaryService = DictionaryService;
exports.DictionaryService = DictionaryService = DictionaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        redis_service_1.RedisService])
], DictionaryService);
//# sourceMappingURL=dictionary.service.js.map