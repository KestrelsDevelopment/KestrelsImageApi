import winston from 'winston';
import type { ILogger } from './ILogger.ts';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    const metaString = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
    return `${timestamp} [${level}]: ${stack || message} ${metaString}`;
});

const winstonInstance = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        process.env.NODE_ENV !== 'production' ? colorize() : winston.format.uncolorize(),
        logFormat
    ),
    transports: [new winston.transports.Console()],
});

// Wrap winston to match our ILogger interface strictly
export const logger: ILogger = {
    info: (msg, meta) => winstonInstance.info(msg, meta),
    error: (msg, err, meta) => winstonInstance.error(msg, { error: err, ...meta }),
    warn: (msg, meta) => winstonInstance.warn(msg, meta),
    debug: (msg, meta) => winstonInstance.debug(msg, meta),
};