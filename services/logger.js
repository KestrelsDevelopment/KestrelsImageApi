import winston from "winston";

const {combine, timestamp, printf, colorize} = winston.format;

const customFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
})

const logger = winston.createLogger({
    level: "silly",
    format: combine(
        colorize(),
        timestamp({ format: process.env.LOGGER_FORMATE || "DD-MM-YYYY HH:mm:ss" }),
        customFormat
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: '../logs/error.log', level: 'error'}),
        new winston.transports.File({filename: '../logs/combined.log'}),
    ]
})

export default logger;