import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private readonly client?: Redis;
  private readonly local = new Map<string, { value: string; expiresAt: number }>();
  private readonly production: boolean;

  constructor(config: ConfigService) {
    this.production = config.get<string>('NODE_ENV') === 'production';
    const url = config.get<string>('REDIS_URL');
    if (!url) {
      if (this.production) {
        throw new Error('REDIS_URL is required in production for distributed throttling and quiz sessions.');
      }
      this.logger.warn('REDIS_URL is not set; shared cache and distributed throttling are disabled.');
      return;
    }
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 250, 3000),
      enableOfflineQueue: false,
    });
    this.client.on('error', (error) => this.logger.warn(`Redis connection error: ${error.message}`));
  }

  async onModuleInit(): Promise<void> {
    if (!this.client) return;
    if (this.client.status === 'wait') await this.client.connect();
    await this.client.ping();
  }

  get available(): boolean {
    return this.client?.status === 'ready';
  }

  async get(key: string): Promise<string | null> {
    if (!this.available) return this.production && key.startsWith('vocab:quiz:') ? null : this.getLocal(key);
    try { return (await this.client!.get(key)) ?? this.getLocal(key); }
    catch (error: any) {
      this.logger.warn(`Redis GET failed: ${error.message}`);
      return this.getLocal(key);
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    this.local.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    if (!this.available) return false;
    try {
      await this.client!.set(key, value, 'EX', Math.max(1, ttlSeconds));
      return true;
    } catch (error: any) {
      this.logger.warn(`Redis SET failed: ${error.message}`);
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    this.local.delete(key);
    if (this.available) {
      try { await this.client!.del(key); }
      catch (error: any) { this.logger.warn(`Redis DEL failed: ${error.message}`); }
    }
  }

  private getLocal(key: string): string | null {
    const entry = this.local.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.local.delete(key);
      return null;
    }
    return entry.value;
  }

  async eval(script: string, keys: string[], args: Array<string | number>): Promise<any> {
    if (!this.available) return null;
    try { return await this.client!.eval(script, keys.length, ...keys, ...args.map(String)); }
    catch (error: any) {
      this.logger.warn(`Redis script failed: ${error.message}`);
      return null;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client && this.client.status !== 'end') await this.client.quit();
  }
}
