import simpleGit from "simple-git";
import redis from "redis";
import logger from '../services/logger.js'
import fs from 'fs';
const fsPromises = require('fs').promises;
const path = require('path');


// set paths
const localPath = process.env.REPO_PATH || "./data/repo";
const remotePath = process.env.REPO_URL || "https://github.com/KestrelsDevelopment/KestrelsNest";

// set redis values
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || 637;


async function establishRedis() {
    //setup redis
    const redisClient = new redis.createClient({
        socket: {
            host: redisHost,
            port: redisPort
        }
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    
    logger.debug('Redis Client Ready');
    
    return redisClient;
}

async function cloneRepo() {
    if (!fs.existsSync(localPath)) {
        try {
            logger.debug("Repository not found locally. Cloning...");
            const git = simpleGit();
            await git.clone(remotePath, localPath);
            logger.debug("Repository cloned successfully.");
        } catch (err) {
            logger.error(`Error cloning git repository: ${err}`);
        }
    } else {
        logger.debug("Repository already exists locally. Skipping clone.");
    }
}

async function pullRepo() {
    try {
        let repoGit = simpleGit(localPath);
        let result = await repoGit.pull();
        logger.debug(`Repository Pulled: ${JSON.stringify(result)}`);

        // Check if there are changes based on the summary or files updated.
        return result && result.summary && (result.summary.changes > 0 || (result.files && result.files.length > 0));
        
    } catch (err) {
        logger.error(`Error Pulling git repository: ${err}`);
        return false;
    }
}

async function pushRedis(redisClient, imageName, data) {
    // Connection to redis is opened
    await redisClient.connect({});
    logger.debug(`Redis Client Connected to ${redisHost}:${redisPort}`);
    
    let key = `image:${imageName}`;
    
    // Push data to Redis
    await  redisClient.hSet(key, data);
    logger.debug(`Pushed Image ${key} to redis`);
    
    await redisClient.disconnect();
    logger.debug(`Redis Client Disconnected`);
}

async function getImagePaths(dir) {
    const imageFiles = [];
    const dirs = [dir];

    while (dirs.length) {
        const currentDir = dirs.pop();
        const entries = await fsPromises.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                dirs.push(fullPath);
            } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name)) {
                imageFiles.push(fullPath);
            }
        }
    }

    return imageFiles;
}

async function runAutoUpdate() {
    
    // check for updates
    let changes = await pullRepo();
    if (changes) {
        
        let redis = await establishRedis();
        let imagePaths = await getImagePaths(localPath);

        
    }

}

export async function startAutoUpdate(interval = 300000) {
    
    // initializing repo if not already initialized
    await cloneRepo();
    
    // Puling the Repo
    await runAutoUpdate();

    logger.info("Starting auto-update of git repo...");
    
    return setInterval(runAutoUpdate, interval);
}