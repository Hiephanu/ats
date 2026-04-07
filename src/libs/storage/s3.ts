import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client: S3Client | null = null;

export interface UploadOptions {
    bucket: string;
    key: string;
    body: Buffer | Uint8Array;
    contentType: string;
}

export interface GetSignedUrlOptions {
    bucket: string;
    key: string;
    expiresIn?: number;
}

export const getS3Client = (): S3Client => {
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

export const uploadFile = async (options: UploadOptions): Promise<string> => {
    const client = getS3Client();
    const command = new PutObjectCommand({
        Bucket: options.bucket,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType,
    });

    await client.send(command);
    return `https://${options.bucket}.s3.amazonaws.com/${options.key}`;
};

export const getSignedDownloadUrl = async (options: GetSignedUrlOptions): Promise<string> => {
    const client = getS3Client();
    const command = new GetObjectCommand({
        Bucket: options.bucket,
        Key: options.key,
    });

    return getSignedUrl(client, command, { expiresIn: options.expiresIn || 3600 });
};

export const getSignedUploadUrl = async (options: GetSignedUrlOptions): Promise<string> => {
    const client = getS3Client();
    const command = new PutObjectCommand({
        Bucket: options.bucket,
        Key: options.key,
    });

    return getSignedUrl(client, command, { expiresIn: options.expiresIn || 3600 });
};
