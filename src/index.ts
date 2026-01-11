import express, { type Application } from 'express';
import helmet from "helmet";
import compression from "compression";
import {logger} from "./Services/Logger/Logger.js";

const app: Application = express();

app.use(express.json());
app.use(helmet());
app.use(compression());

const PORT: number = parseInt(process.env.API_PORT || '3000', 10);

app.listen(PORT, () => {
    logger.info(`Server is running on port "${PORT}"`);
});