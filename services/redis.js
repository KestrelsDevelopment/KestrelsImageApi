import redis from 'redis';
import logger from '../services/logger.js';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || 6379;

async function establishRedis() {
    // Create a Redis client with the configured host and port.
    const redisClient = redis.createClient({
        socket: { host: redisHost, port: redisPort }
    });

    // Log any errors encountered by the Redis client.
    redisClient.on('error', (err) => logger.error('Redis Client Error', err));

    // log that redis client is rdy
    logger.debug('Redis Client Ready');

    return redisClient;
}

export default establishRedis;
