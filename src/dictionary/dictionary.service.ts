import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';

export interface FreeDictResponse {
  word: string;
  slug: string;
  pos: string[];
  definitionShort: string;
  definitions: Array<{ pos: string; sense: string; register?: string | null }>;
  pronunciationIpa?: string;
  respelling?: string;
  cefrLevel?: string;
  bengaliMeaning?: string;
  bengaliRomanised?: string;
  translations?: any[];
  source: string;
}

export type WordRelation = 'synonyms' | 'antonyms' | 'related' | 'topics' | 'rhymes';

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);
  private cache = new Map<string, { expiresAt: number; value: any }>();
  private readonly cacheTtlMs = 60 * 60 * 1000;
  private readonly freeDictApiKey: string;
  private readonly freeDictBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.freeDictApiKey =
      this.configService.get<string>('FREEDICT_API_KEY') || '';
    this.freeDictBaseUrl =
      this.configService.get<string>('FREEDICT_API_URL') || 'https://freedict.com/api/v1';
  }

  /**
   * Fetches paginated words directly from FreeDict API with Bengali translations & CEFR levels
   */
  async listFreeDictWords(page: number = 1, limit: number = 20) {
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
      const response = await axios.get(`${this.freeDictBaseUrl}/words`, {
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

      const formatted = data.words.map((w: any) => {
        const bnTrans = w.translations?.find((t: any) => t.code === 'bn');
        const bengaliMeaning =
          bnTrans?.words?.map((bw: any) => bw.word).join(', ') || null;
        const bengaliRomanised =
          bnTrans?.words?.map((bw: any) => bw.romanised).filter(Boolean).join(', ') || null;

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
    } catch (err: any) {
      this.logger.error(`Error fetching words list from FreeDict: ${err.message}`);
      throw err;
    }
  }

  /**
   * Directly queries FreeDict API with Bengali translations & CEFR levels
   */
  async lookupFreeDict(word: string): Promise<FreeDictResponse | null> {
    const normalized = word.trim().toLowerCase();
    const cacheKey = `freedict:${normalized}`;

    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    if (!this.freeDictApiKey) return null;

    try {
      const response = await axios.get(
        `${this.freeDictBaseUrl}/words/${encodeURIComponent(normalized)}`,
        {
          params: {
            locale: 'en-US',
            include: 'translations',
          },
          headers: {
            'X-API-Key': this.freeDictApiKey,
          },
          timeout: 6000,
        }
      );

      const data = response.data?.data;
      if (!data) return null;

      // Extract Bengali translation
      let bengaliMeaning: string | undefined;
      let bengaliRomanised: string | undefined;

      if (Array.isArray(data.translations)) {
        const bnTrans = data.translations.find(
          (t: any) => t.code === 'bn' || t.language?.toLowerCase() === 'bengali'
        );
        if (bnTrans?.words && Array.isArray(bnTrans.words)) {
          bengaliMeaning = bnTrans.words.map((w: any) => w.word).join(', ');
          bengaliRomanised = bnTrans.words
            .map((w: any) => w.romanised)
            .filter(Boolean)
            .join(', ');
        }
      }

      const result: FreeDictResponse = {
        word: data.word,
        slug: data.slug,
        pos: Array.isArray(data.pos) ? data.pos : [data.pos || 'noun'],
        definitionShort: data.definition_short || '',
        definitions: Array.isArray(data.definitions)
          ? data.definitions.map((d: any) => ({
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
    } catch (err: any) {
      this.logger.debug(`FreeDict lookup error for '${word}': ${err.message}`);
      return null;
    }
  }

  /**
   * Queries OpenDictionary / Free Dictionary API for audio pronunciation and extra details
   */
  async lookupOpenDictionary(word: string): Promise<any | null> {
    const normalized = word.trim().toLowerCase();
    const endpoints = [
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`,
    ];

    for (const url of endpoints) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        if (Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      } catch {}
    }
    return null;
  }

  /**
   * Comprehensive unified lookup combining FreeDict (Bengali translations + CEFR)
   * with FreeDictionary audio files and definitions
   */
  async lookupWord(word: string) {
    const normalized = word.trim().toLowerCase();
    const cached = await this.getCached(normalized);
    if (cached) return cached;

    // 1. Fetch from FreeDict (with Bangla translations + CEFR)
    const freeDictData = await this.lookupFreeDict(normalized);

    // 2. Fetch audio and extra definitions from OpenDictionary / Free Dictionary
    const openDictRaw = await this.lookupOpenDictionary(normalized);
    const openEntry = openDictRaw?.[0];

    let phoneticUs: string | null = freeDictData?.pronunciationIpa || null;
    let phoneticUk: string | null = freeDictData?.pronunciationIpa || null;
    let audioUsUrl: string | null = null;
    let audioUkUrl: string | null = null;
    const synonyms = new Set<string>();
    const antonyms = new Set<string>();
    const definitions: any[] = [];

    if (openEntry) {
      if (Array.isArray(openEntry.phonetics)) {
        for (const p of openEntry.phonetics) {
          if (p.text && !phoneticUs) phoneticUs = p.text;
          if (p.audio) {
            if (p.audio.includes('-us.') || p.audio.includes('en-us')) {
              audioUsUrl = p.audio;
              if (p.text) phoneticUs = p.text;
            } else if (p.audio.includes('-uk.') || p.audio.includes('en-uk')) {
              audioUkUrl = p.audio;
              if (p.text) phoneticUk = p.text;
            } else if (!audioUsUrl) {
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
              d.synonyms.forEach((s: string) => synonyms.add(s));
            }
            if (Array.isArray(d.antonyms)) {
              d.antonyms.forEach((a: string) => antonyms.add(a));
            }
          }
        }
      }
    }

    // If FreeDict provided definitions, merge them if definitions list is empty
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

  private async getCached(key: string): Promise<any | undefined> {
    const shared = await this.redis.get(`vocab:dictionary:v1:${key}`);
    if (shared) {
      try { return JSON.parse(shared); }
      catch { /* Ignore corrupt cache values and refresh from the provider. */ }
    }
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  private async setCached(key: string, value: any): Promise<void> {
    if (this.cache.size >= 500) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
    await this.redis.set(`vocab:dictionary:v1:${key}`, JSON.stringify(value), this.cacheTtlMs / 1000);
  }

  async getRawEntries(word: string) {
    const raw = await this.lookupOpenDictionary(word);
    return raw || [];
  }

  /** Related-word suggestions from Datamuse. This is intentionally separate from
   * definitions: Datamuse is a word-finding API, not a dictionary source. */
  async getRelatedWords(word: string, relation: WordRelation = 'related', limit = 10) {
    const normalized = word.trim().toLowerCase();
    if (!/^[a-z][a-z' -]{0,79}$/i.test(normalized)) {
      throw new BadRequestException('Word must contain only letters, spaces, apostrophes, or hyphens.');
    }

    const safeLimit = Math.min(20, Math.max(1, limit));
    const cacheKey = `datamuse:${relation}:${normalized}:${safeLimit}`;
    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    const relationParams: Record<Exclude<WordRelation, 'topics'>, string> = {
      synonyms: 'rel_syn',
      antonyms: 'rel_ant',
      related: 'ml',
      rhymes: 'rel_rhy',
    };

    try {
      const response = await axios.get('https://api.datamuse.com/words', {
        params: relation === 'topics'
          ? { ml: normalized, topics: normalized, max: safeLimit }
          : { [relationParams[relation]]: normalized, max: safeLimit },
        timeout: 4000,
        headers: { 'User-Agent': 'VocabMaster/1.0 (dictionary related-words)' },
      });
      const results = Array.isArray(response.data)
        ? response.data
            .filter((entry: any) => typeof entry?.word === 'string')
            .slice(0, safeLimit)
            .map((entry: any) => ({ word: entry.word, score: entry.score ?? null }))
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
    } catch (error: any) {
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

  async getAudioUrl(text: string, accent: 'US' | 'UK' | 'BN' = 'US') {
    const lang = accent === 'BN' ? 'bn' : accent === 'UK' ? 'en-GB' : 'en-US';
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
  }
}
