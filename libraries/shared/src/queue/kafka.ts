import { Kafka, Admin, Producer, Consumer } from "kafkajs";

let kafkaClient: Kafka | null = null;

export const getKafkaClient = async (): Promise<Kafka> => {
    if (kafkaClient) return kafkaClient;

    kafkaClient = new Kafka({
        clientId: "ats",
        brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
        retry: {
            initialRetryTime: 1000,
            retries: 3
        }
    });

    return kafkaClient;
}

export const getAdmin = async (): Promise<Admin> => {
    const client = await getKafkaClient();
    return client.admin();
}

export const getProducer = async (): Promise<Producer> => {
    const client = await getKafkaClient();
    return client.producer();
}

export const getConsumer = async (groupId: string): Promise<Consumer> => {
    const client = await getKafkaClient();
    return client.consumer({ groupId });
}

export const produce = async (topic: string, value: string | Buffer) => {
    const producer = await getProducer();
    await producer.connect();
    await producer.send({
        topic,
        messages: [
            { value },
        ],
    });
    await producer.disconnect();
}  