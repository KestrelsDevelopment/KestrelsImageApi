import express from 'express';
import logger from './services/logger.js'
import images from './services/controler.js'
import {startAutoUpdate} from "./services/imageHandler.js";

const app = express();

startAutoUpdate();

// Middleware to parse JSON bodies
app.use(express.json());

// Place this at the beginning of your middleware stack
app.get('/favicon.ico', (req, res) => res.status(204).end());


// Set /* to be sent to images controler
app.use('/*', images);

// Catch-all middleware to handle 404 errors
app.use((req, res, next) => {
    logger.http(`returned 404 to source "${req.ip}" on URI "${req.url}"`)
    res.status(404).json({ error: 'Not Found' });
});

// Setup of the webserver
const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port "${PORT}"`);
});
