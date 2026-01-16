import { createClient } from 'redis';
import type { ICacheService } from './ICacheService.js';
import {config} from '../ConfigService/ConfigService.js';
import { logger } from '../Logger/Logger.js';

class CacheService implements ICacheService {
    private client = createClient({ 
        url: config.redis.url 
    });

    constructor() {
        this.client.on('error', (err) => logger.error('Redis Client Error', err));
        this.client.connect().catch(err => logger.error('Redis Connection Failed', err));
    }

    async get(key: string): Promise<Buffer | null> {
        try {
            const data = await this.client.get(key);
            
            if (!data) return null;
            
            return Buffer.from(data, 'base64');
        } catch (err) {
            logger.error(`Cache get error for key ${key}`, err as Error);
            return null;
        }
    }

    async set(key: string, value: Buffer, ttl = 3600): Promise<void> {
        try {
            const base64Value = value.toString('base64');
            
            await this.client.set(key, base64Value, { EX: ttl });
        } catch (err) {
            logger.error(`Cache set error for key ${key}`, err as Error);
        }
    }
}

export const cacheService: ICacheService = new CacheService();