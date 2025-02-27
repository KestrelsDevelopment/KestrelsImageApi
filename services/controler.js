import establishRedis from '../services/redis.js';
import logger from '../services/logger.js';

// List of available target sizes
const targetSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];

// Find the nearest available resolution given the requested size
function getNearestResolution(requestedSize) {
    const reqNum = parseInt(requestedSize, 10);
    if (isNaN(reqNum)) return 'original';
    for (const current of targetSizes) {
        if (current >= reqNum) return `${current}x${current}`
    }
    return 'original';
}

// Retrieve image from Redis and return binary Buffer
async function getImageBinary(imageAttributes) {
    const redisConnection = await establishRedis();
    const redisKey = `image:${imageAttributes.name}`;
    // If size is provided, find the nearest resolution; otherwise, use original
    const resolution = imageAttributes.resolution ? getNearestResolution(imageAttributes.resolution) : 'original';

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
const getImageAttributes = (req) => {
    // Remove any leading slash
    let name = req.baseUrl.slice(1);

    // Remove file extension if it exists (e.g., .png, .avif)
    name = name.replace(/\.[^.]+$/, "");

    // get Resolution attribute
    let resolution = req.query['size'];

    return { name, resolution };
};


// Express handler to serve images with request logging
const images = async (req, res) => {
    // Log the request with the source IP and request path
    logger.debug(`Incoming request from ${req.ip} for ${req.originalUrl}`);

    try {
        const imageAttributes = getImageAttributes(req);
        const image = await getImageBinary(imageAttributes);

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
