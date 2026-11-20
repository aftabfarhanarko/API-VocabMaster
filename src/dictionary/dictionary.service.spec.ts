import axios from 'axios';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DictionaryService } from './dictionary.service';
import { RedisService } from '../redis/redis.service';

jest.mock('axios');

describe('DictionaryService related word provider', () => {
  let service: DictionaryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DictionaryService(
      { get: jest.fn() } as unknown as ConfigService,
      { get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue(false) } as any as RedisService,
    );
  });

  it('normalizes and bounds Datamuse suggestions', async () => {
    jest.mocked(axios.get).mockResolvedValue({
      data: [{ word: 'joyful', score: 900 }, { word: 'glad', score: 700 }],
    } as any);

    const result = await service.getRelatedWords(' HAPPY ', 'synonyms', 99);

    expect(axios.get).toHaveBeenCalledWith(
      'https://api.datamuse.com/words',
      expect.objectContaining({
        params: { rel_syn: 'happy', max: 20 },
        timeout: 4000,
      }),
    );
    expect(result.data).toEqual([
      { word: 'joyful', score: 900 },
      { word: 'glad', score: 700 },
    ]);
    expect(result.source).toBe('Datamuse');
  });

  it('returns an empty result if the provider is unavailable', async () => {
    jest.mocked(axios.get).mockRejectedValue(new Error('offline'));

    await expect(service.getRelatedWords('happy')).resolves.toMatchObject({
      data: [],
      unavailable: true,
    });
  });

  it('rejects malformed words before making a provider request', async () => {
    await expect(service.getRelatedWords('happy?')).rejects.toBeInstanceOf(BadRequestException);
    expect(axios.get).not.toHaveBeenCalled();
  });
});
