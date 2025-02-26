import simpleGit from "simple-git";
import redis from "redis";
import logger from '../services/logger.js'
import fs from 'fs';
import * as fsPromises from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// set paths
const localPath = process.env.REPO_PATH || "./data/repo";
const remotePath = process.env.REPO_URL || "https://github.com/KestrelsDevelopment/KestrelsNest";

// set redis values
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || 6379;

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
    if (fs.existsSync(localPath)) {
        logger.debug("Repository already exists locally. Skipping clone.");
        return;
    }
    
    try {
        logger.debug("Repository not found locally. Cloning...");
        const git = simpleGit();
        await git.clone(remotePath, localPath);
        logger.debug("Repository cloned successfully.");
    } catch (err) {
        logger.error(`Error cloning git repository: ${err}`);
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

async function pushRedis(redisClient, key, data) {
    // Connection to redis is opened
    await redisClient.connect({});
    logger.debug(`Redis Client Connected to ${redisHost}:${redisPort}`);

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
            } else if (
                /\.(jpg|png|webp)$/i.test(entry.name) &&
                !/^(favicon|apple-touch-icon|android-chrome)/i.test(entry.name)
            ) {
                imageFiles.push(fullPath);
            }
        }
    }

    return imageFiles;
}


async function processImages(redisClient, imagePath) {
    try {
        // Read the image file from disk.
        let imageBuffer = await fsPromises.readFile(imagePath);
        // Extract the image name (without extension) for the Redis key.
        let imageName = path.basename(imagePath, path.extname(imagePath));
        let redisKey = `image:${imageName}`;

        // Retrieve the metadata to check the original image's dimensions.
        let metadata = await sharp(imageBuffer).metadata();

        // Convert the original image to AVIF format.
        let originalAvifBuffer = await sharp(imageBuffer).avif().toBuffer();
        let imageData = {
            'original': originalAvifBuffer.toString('base64')
        };

        // Define target resolutions (square dimensions).
        let targetSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];

        // Process each target size.
        for (let size of targetSizes) {
            let label = `${size}x${size}`;

            // If the original image is smaller than the target resolution,
            // use the original AVIF (do not upscale).
            if (metadata.width <= size && metadata.height <= size) {
                imageData[label] = imageData['original'];
                continue;
            } 
            // Otherwise, resize the image while preserving aspect ratio.
            let resizedBuffer = await sharp(imageBuffer)
                .resize(size, size, { fit: 'inside', withoutEnlargement: true })
                .avif()
                .toBuffer();
            imageData[label] = resizedBuffer.toString('base64');
        }

        // Push the image data into Redis as a hash.
        await pushRedis(redisClient, redisKey, imageData);
        logger.debug(`Successfully processed and pushed image ${imageName} with resolutions: original, ${targetSizes.map(s => `${s}x${s}`).join(', ')}`);
    } catch (err) {
        logger.error(`Error processing image ${imagePath}: ${err}`);
    }
}

async function runAutoUpdate() {
    
    // check for updates
    let changes = await pullRepo();
    if (changes) {
        let redis = await establishRedis();
        let imagePaths = await getImagePaths(localPath);
        logger.debug(`started Conversion`);
        for (let imagePath of imagePaths) {
            await processImages(redis, imagePath);
        }
    }

}

export async function startAutoUpdate(interval = 300000) {
    
    // initializing repo if not already initialized
    await cloneRepo();
    // initially fill redis

    let redis = await establishRedis();
    let imagePaths = await getImagePaths(localPath);
    logger.debug(`started initial Conversion`);
    for (let imagePath of imagePaths) {
        await processImages(redis, imagePath);
    }


    // Puling the Repo
    await runAutoUpdate();

    logger.info("Starting auto-update of git repo...");
    
    return setInterval(runAutoUpdate, interval);
}