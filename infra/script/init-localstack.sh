#!/bin/bash
# Init script — runs automatically when LocalStack is ready.
# Creates the SQS queues needed for local development.

echo "Creating SQS queues…"

awslocal sqs create-queue --queue-name cv-processing

echo "SQS queues created:"
awslocal sqs list-queues
