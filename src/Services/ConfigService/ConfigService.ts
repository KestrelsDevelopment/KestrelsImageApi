import type { IConfigService } from './IConfigService.ts';

class ConfigService {
    private readonly config: IConfigService;

    constructor() {
        this.config = this.validateAndLoad();
    }

    private validateAndLoad(): Readonly<{
        port: number;
        nodeEnv: "development" | "production" | "test";
        redis: { url: string };
        imageRepo: { path: string };
        logger: { level: string; colorize: boolean }
    }> {
        const {
            PORT,
            NODE_ENV,
            REDIS_URL,
            REPO_PATH,
            LOGLEVEL,
            LOGCOLORIZE
        } = process.env;

        // Validation logic
        if (!REDIS_URL) throw new Error("Config Error: REDIS_URL is required");
        if (!REPO_PATH) throw new Error("Config Error: REPO_PATH is required");

        return Object.freeze({
            port: parseInt(PORT || '3000', 10),
            nodeEnv: (NODE_ENV as IConfigService['nodeEnv']) || 'development',
            redis: {
                url: REDIS_URL,
            },
            imageRepo: {
                path: REPO_PATH,
            },
            logger: {
                level: LOGLEVEL || 'info',
                colorize: LOGCOLORIZE !== 'false',
            }
        });
    }

    get all(): IConfigService {
        return this.config;
    }
}

export const configService = new ConfigService();
export const config = configService.all;