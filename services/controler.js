import establishRedis from '../services/redis.js';
import logger from '../services/logger.js';

// List of available target sizes
const targetSizes = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];

// Find the nearest available resolution given the requested size
function getNearestResolution(requestedSize) {
    const reqNum = parseInt(requestedSize, 10);
    if (isNaN(reqNum)) return 'original';
    const nearest = targetSizes.reduce((prev, curr) =>
        Math.abs(curr - reqNum) < Math.abs(prev - reqNum) ? curr : prev
    );
    return `${nearest}x${nearest}`;
}

// Retrieve image from Redis and return binary Buffer
async function getImage({ name, resolution: size }) {
    const redisConnection = await establishRedis();
    const redisKey = `image:${name}`;
    // If size is provided, find the nearest resolution; otherwise, use original
    const resolution = size ? getNearestResolution(size) : 'original';

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
    // Remove any leading slash
    const trimmed = uri.startsWith('/') ? uri.slice(1) : uri;

    // Split the URI on "?" to separate the filename from the query
    let [name, query] = trimmed.split('?');

    // Remove file extension if it exists (e.g., .png, .avif)
    name = name.replace(/\.[^.]+$/, "");

    let resolution;
    if (query) {
        // Expecting query to be in the format "size=60"
        const match = query.match(/size=(\d+)/);
        if (match) {
            resolution = match[1];
        }
    }

    return { name, resolution };
};


// Express handler to serve images with request logging
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
