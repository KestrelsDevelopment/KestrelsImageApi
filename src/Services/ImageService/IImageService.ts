export interface ImageResponse {
    data: Buffer;
    format: string;
}

export interface IImageService {
    getImage(filename: string, size?: number): Promise<ImageResponse>;
}