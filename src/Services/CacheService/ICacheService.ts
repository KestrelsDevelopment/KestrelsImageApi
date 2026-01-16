export interface ICacheService {
    get(key: string): Promise<Buffer | null>;
    set(key: string, value: Buffer, ttl?: number): Promise<void>;
}