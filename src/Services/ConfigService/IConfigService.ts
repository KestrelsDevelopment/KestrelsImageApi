export interface IConfigService {
    port: number;
    nodeEnv: 'development' | 'production' | 'test';
    redis: {
        url: string;
    };
    imageRepo: {
        path: string;

    };
    logger: {
        level: string;
        colorize: boolean;
    }
}