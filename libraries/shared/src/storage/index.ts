import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

export interface StorageService {
    upload(key: string, body: Buffer, contentType: string): Promise<string>;
    download(key: string): Promise<Buffer>;
    delete(key: string): Promise<void>;
    getUrl(key: string): string;
}

export interface UploadOptions {
    key: string;
    body: Buffer;
    contentType: string;
}

let s3Client: S3Client | null = null;

const getS3Client = (): S3Client => {
    if (!s3Client) {
        s3Client = new S3Client({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            },
            endpoint: process.env.AWS_ENDPOINT,
            forcePathStyle: process.env.AWS_FORCE_PATH_STYLE === "true",
        });
    }
    return s3Client;
};

export class S3StorageService implements StorageService {
    private bucket: string;

    constructor(bucket: string) {
        this.bucket = bucket;
    }

    async upload(key: string, body: Buffer, contentType: string): Promise<string> {
        const client = getS3Client();
        await client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }));
        return this.getUrl(key);
    }

    async download(key: string): Promise<Buffer> {
        const client = getS3Client();
        const response = await client.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
        
        if (!response.Body) throw new Error("Empty response");
        
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as any) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }

    async delete(key: string): Promise<void> {
        const client = getS3Client();
        await client.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
    }

    getUrl(key: string): string {
        return `https://${this.bucket}.s3.amazonaws.com/${key}`;
    }
}

export class LocalStorageService implements StorageService {
    private basePath: string;

    constructor(basePath: string) {
        this.basePath = basePath;
    }

    async upload(key: string, body: Buffer, _contentType: string): Promise<string> {
        const fullPath = path.join(this.basePath, key);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, body);
        return this.getUrl(key);
    }

    async download(key: string): Promise<Buffer> {
        const fullPath = path.join(this.basePath, key);
        return fs.readFile(fullPath);
    }

    async delete(key: string): Promise<void> {
        const fullPath = path.join(this.basePath, key);
        await fs.unlink(fullPath);
    }

    getUrl(key: string): string {
        return `file://${path.join(this.basePath, key)}`;
    }
}

export const createStorageService = (): StorageService => {
    const provider = process.env.STORAGE_PROVIDER || "local";
    
    if (provider === "s3") {
        const bucket = process.env.CV_S3_BUCKET || "ats-cvs";
        return new S3StorageService(bucket);
    }
    
    const basePath = process.env.LOCAL_STORAGE_PATH || "./storage";
    return new LocalStorageService(basePath);
};
