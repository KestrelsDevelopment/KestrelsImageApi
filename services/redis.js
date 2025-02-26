import redis from "redis";
import logger from '../services/logger.js'

// set redis values
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || 6379;
async function establishRedis() {


    //setup redis
    let redisClient = new redis.createClient({
        socket: {
            host: redisHost,
            port: redisPort
        }
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));

    logger.debug('Redis Client Ready');

    return redisClient;
}

export default establishRedis;