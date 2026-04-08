import { createClient, RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;

export interface QueueMessage<T = any> {
    id: string;
    payload: T;
    retryCount?: number;
    maxRetries?: number;
    createdAt?: number;
}

export interface MessageHandler {
    (message: QueueMessage): Promise<void>;
}

export interface QueueOptions {
    maxRetries?: number;
    retryDelay?: number;
    retryBackoff?: number;
}

const DEFAULT_OPTIONS = {
    maxRetries: 3,
    retryDelay: 1000,
    retryBackoff: 2,
};

export const getRedisClient = async (): Promise<RedisClientType> => {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }

    redisClient = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379"
    });

    redisClient.on("error", (err) => console.error("Redis Client Error", err));

    await redisClient.connect();
    return redisClient;
};

export const publish = async (channel: string, message: object): Promise<void> => {
    const client = await getRedisClient();
    await client.publish(channel, JSON.stringify(message));
};

export const subscribe = async (channel: string, callback: (message: string) => void): Promise<void> => {
    const client = await getRedisClient();
    const subscriber = client.duplicate();
    await subscriber.connect();

    await subscriber.subscribe(channel, (message) => {
        callback(message);
    });
};

export const createQueue = (options: QueueOptions = {}) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const generateMessageId = () => `msg:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;

    const publish = async (channel: string, payload: object): Promise<string> => {
        const client = await getRedisClient();
        const message: QueueMessage = {
            id: generateMessageId(),
            payload,
            retryCount: 0,
            maxRetries: opts.maxRetries,
            createdAt: Date.now(),
        };

        await client.publish(channel, JSON.stringify(message));
        return message.id;
    };

    const subscribe = async (
        channel: string,
        handler: MessageHandler,
        onFailure?: (message: QueueMessage, error: Error) => void
    ): Promise<void> => {
        const client = await getRedisClient();
        const subscriber = client.duplicate();
        await subscriber.connect();

        const processWithRetry = async (message: QueueMessage): Promise<void> => {
            const maxRetries = message.maxRetries || opts.maxRetries!;
            let retryCount = message.retryCount || 0;

            while(retryCount < maxRetries) {
                try {
                    await handler(message);
                    return;
                } catch (error) {
                    const err = error as Error;
                    console.error(`Error processing message ${message.id}:`, err.message);

                    retryCount++;
                    const delay = opts.retryDelay! * Math.pow(opts.retryBackoff!, retryCount - 1);
                    console.log(`Retrying message ${message.id} in ${delay}ms (attempt ${retryCount})`);
                    await new Promise(res => setTimeout(res, delay));
                }

                const dlqChannel = `${channel}:dlq`;
                await client.publish(dlqChannel, JSON.stringify({
                    ...message,
                    failedAt: Date.now()
                }));
            }
        
        };

        await subscriber.subscribe(channel, async (msg) => {
            const message: QueueMessage = JSON.parse(msg);
            await processWithRetry(message);
        });

        console.log(`Queue subscriber started on channel: ${channel}`);
    };

    return {
        publish,
        subscribe,
    };
};