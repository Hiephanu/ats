import {
    SQSClient,
    SendMessageCommand,
    ReceiveMessageCommand,
    DeleteMessageCommand,
    type Message,
} from "@aws-sdk/client-sqs";

// ── Singleton SQS Client ──────────────────────────────────────────────

let sqsClient: SQSClient | null = null;

export const getSQSClient = (): SQSClient => {
    if (sqsClient) return sqsClient;

    sqsClient = new SQSClient({
        region: process.env.AWS_REGION || "us-east-1",
        ...(process.env.AWS_ACCESS_KEY_ID && {
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            },
        }),
        ...(process.env.AWS_ENDPOINT && {
            endpoint: process.env.AWS_ENDPOINT,
        }),
    });

    return sqsClient;
};

// ── Send Message ───────────────────────────────────────────────────────

export const sendSQSMessage = async (
    queueUrl: string,
    payload: object | string,
    options?: {
        delaySeconds?: number;
        messageGroupId?: string;
        messageDeduplicationId?: string;
    }
): Promise<string | undefined> => {
    const client = getSQSClient();
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);

    const result = await client.send(
        new SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: body,
            DelaySeconds: options?.delaySeconds,
            MessageGroupId: options?.messageGroupId,
            MessageDeduplicationId: options?.messageDeduplicationId,
        })
    );

    return result.MessageId;
};

// ── Poll Messages (Long-Polling Consumer) ──────────────────────────────

export interface SQSPollOptions {
    /** Long-poll wait time in seconds (max 20). Default: 20 */
    waitTimeSeconds?: number;
    /** Max messages per poll (1-10). Default: 10 */
    maxMessages?: number;
    /** Visibility timeout in seconds. Default: 30 */
    visibilityTimeout?: number;
    /** AbortSignal to stop polling gracefully */
    signal?: AbortSignal;
}

export type SQSMessageHandler = (message: Message) => Promise<void>;

const DEFAULT_POLL_OPTIONS: Required<Omit<SQSPollOptions, "signal">> = {
    waitTimeSeconds: 20,
    maxMessages: 10,
    visibilityTimeout: 30,
};

/**
 * Continuously polls an SQS queue, processes each message with `handler`,
 * and deletes successfully processed messages.
 *
 * The loop runs until the process receives SIGINT/SIGTERM or the
 * optional `signal` is aborted.
 */
export const pollSQSMessages = async (
    queueUrl: string,
    handler: SQSMessageHandler,
    options?: SQSPollOptions
): Promise<void> => {
    const opts = { ...DEFAULT_POLL_OPTIONS, ...options };
    const client = getSQSClient();

    let running = true;

    const shutdown = () => {
        console.log("\n[SQS] Shutting down poller…");
        running = false;
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    options?.signal?.addEventListener("abort", shutdown);

    console.log(`[SQS] Polling started → ${queueUrl}`);

    while (running) {
        try {
            const response = await client.send(
                new ReceiveMessageCommand({
                    QueueUrl: queueUrl,
                    MaxNumberOfMessages: opts.maxMessages,
                    WaitTimeSeconds: opts.waitTimeSeconds,
                    VisibilityTimeout: opts.visibilityTimeout,
                    MessageAttributeNames: ["All"],
                })
            );

            const messages = response.Messages ?? [];

            for (const message of messages) {
                try {
                    await handler(message);

                    // Delete message after successful processing
                    await client.send(
                        new DeleteMessageCommand({
                            QueueUrl: queueUrl,
                            ReceiptHandle: message.ReceiptHandle!,
                        })
                    );
                } catch (err) {
                    console.error(
                        `[SQS] Failed to process message ${message.MessageId}:`,
                        err
                    );
                    // Message stays in queue → will be retried after visibility timeout
                    // or moved to DLQ if configured on the queue itself
                }
            }
        } catch (err) {
            if (!running) break;
            console.error("[SQS] Poll error:", err);
            // Back off briefly before retrying the poll
            await new Promise((r) => setTimeout(r, 2000));
        }
    }

    console.log("[SQS] Poller stopped.");
};
