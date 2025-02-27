import simpleGit from "simple-git";
import logger from "../services/logger.js";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import sharp from "sharp";
import establishRedis from "../services/redis.js";

const localPath = process.env.REPO_PATH || "./data/repo";
const remotePath = process.env.REPO_URL || "https://github.com/KestrelsDevelopment/KestrelsNest";

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
        const repoGit = simpleGit(localPath);
        const result = await repoGit.pull();
        logger.debug(`Repository pulled: ${JSON.stringify(result)}`);
        return result?.summary &&
            (result.summary.changes > 0 || (result.files && result.files.length > 0));
    } catch (err) {
        logger.error(`Error pulling git repository: ${err}`);
        return false;
    }
}

async function pushRedis(redisClient, key, data) {
    try {
        await redisClient.hSet(key, data);
        logger.debug(`Pushed image ${key} to Redis`);
    } catch (err) {
        logger.error(`Error pushing data to Redis for key ${key}: ${err}`);
    }
}

async function getImagePaths(dir) {
    const imageFiles = [];
    const dirs = [dir];

    while (dirs.length) {
        const currentDir = dirs.pop();
        const entries = await fsPromises.readdir(currentDir, {
            withFileTypes: true,
        });

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
        const imageBuffer = await fsPromises.readFile(imagePath);
        const imageName = path.basename(imagePath, path.extname(imagePath));
        const redisKey = `image:${imageName}`;

        const metadata = await sharp(imageBuffer).metadata();
        const originalAvifBuffer = await sharp(imageBuffer).avif().toBuffer();
        const imageData = {
            original: originalAvifBuffer.toString("base64"),
        };

        const targetSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];

        await Promise.all(
            targetSizes.map(async (size) => {
                const label = `${size}x${size}`;
                if (metadata.width <= size && metadata.height <= size) {
                    imageData[label] = imageData.original;
                } else {
                    const resizedBuffer = await sharp(imageBuffer)
                        .resize(size, size, {
                            fit: "inside",
                            withoutEnlargement: true,
                        })
                        .avif()
                        .toBuffer();
                    imageData[label] = resizedBuffer.toString("base64");
                }
            })
        );

        await pushRedis(redisClient, redisKey, imageData);
        logger.debug(
            `Processed and pushed image ${imageName} with resolutions: original, ${targetSizes
                .map((s) => `${s}x${s}`)
                .join(", ")}`
        );
    } catch (err) {
        logger.error(`Error processing image ${imagePath}: ${err}`);
    }
}

async function convertImages(redis) {

    if (!redis.isOpen) {
        await redis.connect();
        logger.debug("Connected to Redis");
    }

    const imagePaths = await getImagePaths(localPath);
    await Promise.all(
        imagePaths.map((imagePath) => processImages(redis, imagePath))
    ).finally(() => redis.disconnect());
}

async function runAutoUpdate(redisClient) {
    const changes = await pullRepo();
    if (changes) {
        await convertImages(redisClient);
    }
}

export async function startAutoUpdate(interval = 300000) {
    await cloneRepo();

    const redis = await establishRedis();

    logger.debug("Started initial conversion");
    await convertImages(redis);

    await runAutoUpdate(redis);
    logger.info("Starting auto-update of git repo...");

    return setInterval(() => {
        runAutoUpdate(redis).catch((err) =>
            logger.error(`Auto-update error: ${err}`)
        );
    }, interval);
}