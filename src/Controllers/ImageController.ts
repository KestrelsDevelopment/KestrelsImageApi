import type { Request, Response } from 'express';
import { imageService } from '../Services/ImageService/ImageService.js';
import { cacheService } from '../Services/CacheService/CacheService.js';
import { logger } from '../Services/Logger/Logger.js';

export const getProcessedImage = async (req: Request, res: Response) => {
    const { filename: rawFilename } = req.params;
    
    if (typeof rawFilename !== 'string' || !/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(rawFilename)) {
        return res.status(404).json({ error: 'Invalid image request' });
    }
    
    const filename: string = rawFilename;

    const sizeStr = req.query.size as string | undefined;
    const size = sizeStr ? parseInt(sizeStr, 10) : undefined;
    const cacheKey = `img:${filename}:${size || 'orig'}`;

    try {
        const cached = await cacheService.get(cacheKey);
        
        const ext = filename.split('.').pop()?.toLowerCase() || 'png';
        const mimeType = ext === 'jpg' ? 'jpeg' : ext;

        if (cached) {
            res.set('X-Cache', 'HIT');
            res.set('Content-Length', cached.length.toString());
            return res.type(`image/${mimeType}`).send(cached);
        }

        const { data, format } = await imageService.getImage(filename, size);
        
        await cacheService.set(cacheKey, data);

        res.set('X-Cache', 'MISS');
        res.set('Content-Length', data.length.toString());
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