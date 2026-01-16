import winston from 'winston';
import type { ILogger } from './ILogger.js';
import { config } from '../ConfigService/ConfigService.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    const metaString = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaString}`;
});

const winstonInstance = winston.createLogger({
    // Use the validated nodeEnv from our config service
    level: config.logger.level,
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        // Toggle colors based on the environment config
        config.logger.colorize ? colorize() : winston.format.uncolorize(),
        logFormat
    ),
    transports: [new winston.transports.Console()],
});

export const logger: ILogger = {
    info: (msg, meta) => winstonInstance.info(msg, meta),
    error: (msg, err, meta) => winstonInstance.error(msg, { error: err, ...meta }),
    warn: (msg, meta) => winstonInstance.warn(msg, meta),
    debug: (msg, meta) => winstonInstance.debug(msg, meta),
};