import express, { type Application } from 'express';
import helmet from "helmet";
import compression from "compression";
import { logger } from './Services/Logger/Logger.js';
import { config } from './Services/ConfigService/ConfigService.js';
import { imageRouter } from './Router/ImageRouter.js';
import { warmupService } from './Services/WarmupService/WarmupService.js';

const app: Application = express();

app.use(express.json());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "blob:"],
        },
    },
}));
app.use(compression());

app.use('/', imageRouter);

app.listen(config.port, async () => {
    logger.info(`Server is running in ${config.nodeEnv} mode on port "${config.port}"`);
    
    // Execute the warmup service
    warmupService.run().catch(err => {
        logger.error('Background warmup failed', err);
    });
});