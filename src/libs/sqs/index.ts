import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, CreateQueueCommand, GetQueueUrlCommand } from "@aws-sdk/client-sqs";

let sqsClient: SQSClient | null = null;

export const getSqsClient = (): SQSClient => {
    if (!sqsClient) {
        sqsClient = new SQSClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            },
            endpoint: process.env.AWS_ENDPOINT,
        });
    }
    return sqsClient;
};

export const getOrCreateQueueUrl = async (queueName: string): Promise<string> => {
    const client = getSqsClient();
    
    try {
        const getQueueUrlResponse = await client.send(new GetQueueUrlCommand({ QueueName: queueName }));
        return getQueueUrlResponse.QueueUrl!;
    } catch {
        const createQueueResponse = await client.send(new CreateQueueCommand({ QueueName: queueName }));
        return createQueueResponse.QueueUrl!;
    }
};

export const sendMessage = async (queueUrl: string, message: object): Promise<void> => {
    const client = getSqsClient();
    await client.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
    }));
};

export const receiveMessages = async (queueUrl: string, maxMessages = 1): Promise<any[]> => {
    const client = getSqsClient();
    const response = await client.send(new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: 20,
    }));
    return response.Messages || [];
};

export const deleteMessage = async (queueUrl: string, receiptHandle: string): Promise<void> => {
    const client = getSqsClient();
    await client.send(new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
    }));
};
