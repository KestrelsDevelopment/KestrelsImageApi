import establishRedis from '../services/redis.js'
import logger from '../services/logger.js'

// get image from redis
async function getImage(imageNameOBJ) {
    let redisConnection = await establishRedis();
    let imageName = imageNameOBJ.name;
    let redisKey = `image:${imageName}`;
    let size = imageNameOBJ.resolution;
    let resolution

    // set Resolution depending on request
    if (size === undefined) {
        resolution = 'original';
    } else {
        resolution = `${size}x${size}`;
    }

    try {
        await redisConnection.connect();
        // Retrieve the Base64 encoded image data from Redis.
        let base64Image = await redisConnection.hGet(redisKey, resolution);
        if (!base64Image) {
            logger.error(`No image found for ${redisKey} at resolution ${resolution}`);
            return null;
        }

        await redisConnection.disconnect();
        // Convert the Base64 string back to binary (Buffer) and return it.
        return Buffer.from(base64Image, 'base64');

    } catch (err) {
        logger.error(`Error retrieving image ${imageName} at resolution ${resolution}: ${err}`);
        return null;
    }}

async function getImageData(uri) {
    // Remove a leading slash if present
    const trimmed = uri.startsWith('/') ? uri.slice(1) : uri;
    // Split the string at the "?" character
    const [name, resolution] = trimmed.split('?');
    return { name, resolution };
}

const images = async (req, res) => {

    try {
        let reqURI = req.originalUrl;

        let ImageNameOBJ = await getImageData(reqURI);

        let image = await getImage(ImageNameOBJ);
        // Set headers so the browser knows the content is an AVIF image.
        res.set('Content-Type', 'image/avif');

        // Optionally, add caching headers if needed.
        res.set('Cache-Control', 'public, max-age=3600');

        // Send the binary image data.
        res.status(200).send(image);
    } catch (error) {
        console.error('Error retrieving image:', error);
        res.status(500).send('Internal Server Error');
    }


}

export default images