import express from 'express';
import logger from './services/logger.js';
import images from './services/controler.js';
import { startAutoUpdate } from './services/imageHandler.js';

const app = express();

// Start auto-update for images.
startAutoUpdate();

// Parse JSON bodies.
app.use(express.json());

// Skip favicon requests.
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// Route all requests to the images controller.
app.use('/*', images);

// Catch-all middleware for 404 errors.
app.use((req, res) => {
    logger.http(`Returned 404 to source "${req.ip}" on URI "${req.url}"`);
    res.status(404).json({ error: 'Not Found' });
});

// Start the server.
const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port "${PORT}"`);
});
