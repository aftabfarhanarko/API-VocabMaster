import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from './redis.service';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

const INCREMENT_SCRIPT = `
local hits = tonumber(redis.call('GET', KEYS[1]) or '0')
local blockTtl = redis.call('PTTL', KEYS[2])
if blockTtl > 0 then
  return {hits, redis.call('PTTL', KEYS[1]), 1, blockTtl}
end
hits = redis.call('INCR', KEYS[1])
if hits == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
if hits > tonumber(ARGV[2]) then
  redis.call('SET', KEYS[2], '1', 'PX', ARGV[3])
  blockTtl = tonumber(ARGV[3])
else
  blockTtl = 0
end
return {hits, ttl, hits > tonumber(ARGV[2]) and 1 or 0, blockTtl}
`;

/** Redis-backed throttler storage shared by all API processes. */
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly local = new Map<string, { hits: number; resetAt: number; blockedUntil: number }>();

  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const base = `${throttlerName}:${key}`;
    const values = await this.redis.eval(
      INCREMENT_SCRIPT,
      [`vocab:throttle:${base}:hits`, `vocab:throttle:${base}:block`],
      [ttl, limit, blockDuration],
    );
    if (Array.isArray(values)) {
      return {
        totalHits: Number(values[0]),
        timeToExpire: Math.max(0, Number(values[1])),
        isBlocked: Number(values[2]) === 1,
        timeToBlockExpire: Math.max(0, Number(values[3])),
      };
    }

    // Local fallback keeps development usable when Redis is not configured.
    const now = Date.now();
    let entry = this.local.get(base);
    if (!entry || entry.resetAt <= now) {
      entry = { hits: 0, resetAt: now + ttl, blockedUntil: 0 };
    }
    if (entry.blockedUntil <= now) entry.hits += 1;
    if (entry.hits > limit && entry.blockedUntil <= now) entry.blockedUntil = now + blockDuration;
    this.local.set(base, entry);
    if (this.local.size > 5000) {
      for (const [localKey, localEntry] of this.local) {
        if (localEntry.resetAt <= now && localEntry.blockedUntil <= now) this.local.delete(localKey);
        if (this.local.size <= 4000) break;
      }
    }
    return {
      totalHits: entry.hits,
      timeToExpire: Math.max(0, entry.resetAt - now),
      isBlocked: entry.blockedUntil > now,
      timeToBlockExpire: Math.max(0, entry.blockedUntil - now),
    };
  }
}
