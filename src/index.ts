import express, { type Application } from 'express';
import helmet from "helmet";
import compression from "compression";
import { logger } from './Services/Logger/Logger.js';
import { config } from './Services/ConfigService/ConfigService.js';

const app: Application = express();

app.use(express.json());
app.use(helmet());
app.use(compression());

app.listen(config.port, () => {
    logger.info(`Server is running in ${config.nodeEnv} mode on port "${config.port}"`);
    logger.debug(`Redis connected to: ${config.redis.url}`);
});