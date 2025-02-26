import establishRedis from '../services/redis.js';
import logger from '../services/logger.js';

// Retrieve image from Redis and return binary Buffer
async function getImage({ name, resolution: size }) {
    const redisConnection = await establishRedis();
    const redisKey = `image:${name}`;
    const resolution = size ? `${size}x${size}` : 'original';

    try {
        await redisConnection.connect();
        const base64Image = await redisConnection.hGet(redisKey, resolution);
        if (!base64Image) {
            logger.error(`No image found for ${redisKey} at resolution ${resolution}`);
            return null;
        }
        return Buffer.from(base64Image, 'base64');
    } catch (err) {
        logger.error(`Error retrieving image ${name} at resolution ${resolution}: ${err}`);
        return null;
    } finally {
        await redisConnection.disconnect();
    }
}

// Parse image data from the URL
const getImageData = (uri) => {
    const trimmed = uri.startsWith('/') ? uri.slice(1) : uri;
    const [name, resolution] = trimmed.split('?');
    return { name, resolution };
};

// Express handler to serve images
const images = async (req, res) => {
    // Log the request with the source IP and request path
    logger.debug(`Incoming request from ${req.ip} for ${req.originalUrl}`);

    try {
        const imageData = getImageData(req.originalUrl);
        const image = await getImage(imageData);

        if (!image) {
            return res.status(404).send('Image not found');
        }

        res.set('Content-Type', 'image/avif');
        res.set('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(image);
    } catch (error) {
        logger.error('Error retrieving image:', error);
        return res.status(500).send('Internal Server Error');
    }
};

export default images;
