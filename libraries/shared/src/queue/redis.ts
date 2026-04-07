import { createClient, RedisClientType } from "redis";

let redisClient: RedisClientType | null = null;

export interface QueueMessage {
    id: string;
    payload: object;
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
            try {
                await handler(message);
            } catch (error) {
                const err = error as Error;
                console.error(`Error processing message ${message.id}:`, err.message);

                const retryCount = (message.retryCount || 0) + 1;

                if (retryCount < (message.maxRetries || opts.maxRetries!)) {
                    const delay = opts.retryDelay! * Math.pow(opts.retryBackoff!, retryCount - 1);
                    console.log(`Retrying message ${message.id} in ${delay}ms (attempt ${retryCount})`);

                    setTimeout(async () => {
                        const retryMessage: QueueMessage = {
                            ...message,
                            retryCount,
                        };
                        await handler(retryMessage);
                    }, delay);
                } else {
                    console.error(`Message ${message.id} failed after max retries`);

                    const dlqChannel = `${channel}:dlq`;
                    await client.publish(dlqChannel, JSON.stringify({
                        ...message,
                        failedAt: Date.now(),
                        lastError: err.message,
                    }));

                    if (onFailure) {
                        onFailure(message, err);
                    }
                }
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