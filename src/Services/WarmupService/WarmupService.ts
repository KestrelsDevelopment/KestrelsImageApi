import type { IWarmupService } from './IWarmupService.js';
import { imageService } from '../ImageService/ImageService.js';
import { cacheService } from '../CacheService/CacheService.js';
import { logger } from '../Logger/Logger.js';

class WarmupService implements IWarmupService {
    async run(): Promise<void> {
        logger.info('Starting image cache warmup...');

        try {
            const images = await imageService.listImages();
            logger.info(`Found ${images.length} images in repository.`);

            let cachedCount = 0;
            for (const filename of images) {
                const cacheKey = `img:${filename}:orig`;

                // Check if already in cache to avoid redundant processing
                const exists = await cacheService.get(cacheKey);
                if (!exists) {
                    try {
                        const { data } = await imageService.getImage(filename);
                        await cacheService.set(cacheKey, data);
                        cachedCount++;
                        logger.debug(`Pre-cached original: ${filename}`);
                    } catch (imgErr) {
                        logger.warn(`Failed to pre-cache ${filename}`, { error: (imgErr as Error).message });
                    }
                }
            }

            logger.info(`Cache warmup completed. Added ${cachedCount} new images to cache.`);
        } catch (err) {
            logger.error('Cache warmup failed significantly', err as Error);
        }
    }
}

export const warmupService: IWarmupService = new WarmupService();