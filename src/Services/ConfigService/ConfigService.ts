import type { IConfigService } from './IConfigService.ts';

class ConfigService {
    private readonly config: IConfigService;

    constructor() {
        this.config = this.validateAndLoad();
    }

    private validateAndLoad(): IConfigService {
        const {
            PORT,
            NODE_ENV,
            REDIS_URL,
            REPO_PATH,
            REPO_URL
        } = process.env;

        // Validation logic
        if (!REDIS_URL) throw new Error("Config Error: REDIS_URL is required");
        if (!REPO_PATH) throw new Error("Config Error: REPO_PATH is required");
        if (!REPO_URL) throw new Error("Config Error: REPO_URL is required");

        return Object.freeze({
            port: parseInt(PORT || '3000', 10),
            nodeEnv: (NODE_ENV as IConfigService['nodeEnv']) || 'development',
            redis: {
                url: REDIS_URL,
            },
            imageRepo: {
                path: REPO_PATH,
                url: REPO_URL,
            },
        });
    }

    get all(): IConfigService {
        return this.config;
    }
}

export const configService = new ConfigService();
export const config = configService.all;