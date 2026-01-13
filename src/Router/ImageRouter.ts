import { Router } from 'express';
import { getProcessedImage } from '../Controllers/ImageController.js';

const router = Router();

router.get('/favicon.ico', (req, res) => res.status(204).end());

router.get('/:filename', getProcessedImage);

export { router as imageRouter };