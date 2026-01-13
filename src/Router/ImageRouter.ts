import { Router } from 'express';
import { getProcessedImage } from '../Controllers/ImageController.js';

const router = Router();

router.get('/:filename', getProcessedImage);

export { router as imageRouter };