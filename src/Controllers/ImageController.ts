import type { Request, Response } from 'express';
import { imageService } from '../Services/ImageService/ImageService.js';
import { cacheService } from '../Services/CacheService/CacheService.js';
import { logger } from '../Services/Logger/Logger.js';

export const getProcessedImage = async (req: Request, res: Response) => {
    const { filename } = req.params;
    const sizeStr = req.query.size as string | undefined;
    const size = sizeStr ? parseInt(sizeStr, 10) : undefined;

    if (typeof filename !== 'string' || filename.length === 0) {
        return res.status(400).json({ error: 'Filename is required' });
    }

    const cacheKey = `img:${filename}:${size || 'orig'}`;

    try {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            res.set('X-Cache', 'HIT');
            return res.type('image/png').send(cached);
        }

        const { data, format } = await imageService.getImage(filename, size);
        
        await cacheService.set(cacheKey, data);

        res.set('X-Cache', 'MISS');
        res.type(`image/${format}`).send(data);
    } catch (error) {
        const msg = (error as Error).message;
        if (msg === 'Access denied') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        logger.error(`Error serving image ${filename}`, error as Error);
        res.status(404).json({ error: 'Image not found' });
    }
};