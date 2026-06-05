import { sendSQSMessage } from "@ats/shared";

const queueUrl =
    process.env.SQS_CV_PROCESSING_QUEUE_URL ||
    "http://localhost:4566/000000000000/cv-processing";

async function main() {
    const fakePayload = {
        candidateId: "test-candidate-123",
        s3Key: "cvs/test-cv.pdf",
        originalFileName: "test-cv.pdf",
    };

    console.log(`Sending fake message to SQS queue: ${queueUrl}`);
    const messageId = await sendSQSMessage(queueUrl, fakePayload);
    console.log(`Message sent successfully! MessageId: ${messageId}`);
}

main().catch(console.error);
