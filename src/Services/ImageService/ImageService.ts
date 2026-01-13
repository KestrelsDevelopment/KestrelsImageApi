import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import type { IImageService, ImageResponse } from './IImageService.js';
import { config } from '../ConfigService/ConfigService.js';

class ImageService implements IImageService {
    private readonly basePath = config.imageRepo.path;

    async getImage(filename: string, size?: number): Promise<ImageResponse> {
        const filePath = path.join(this.basePath, filename);
        const resolvedPath = path.resolve(filePath);
        const rootPath = path.resolve(this.basePath);
        if (!resolvedPath.startsWith(rootPath)) {
            throw new Error('Access denied');
        }
        const image = sharp(filePath);
        const metadata = await image.metadata();
        if (!size || (metadata.width && metadata.width <= size && metadata.height && metadata.height <= size)) {
            return {
                data: await fs.readFile(filePath),
                format: metadata.format || 'png'
            };
        }
        const targetSize = Math.max(16, Math.min(size, 8192));
        const buffer = await image
            .resize(targetSize, targetSize, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .toBuffer();
        return { data: buffer, format: metadata.format || 'png' };
    }
}

export const imageService: IImageService = new ImageService();