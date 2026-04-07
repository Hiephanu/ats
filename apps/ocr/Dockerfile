FROM node:20-alpine

RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng poppler-utils

ENV TESSDATA_PREFIX=/usr/share/tessdata

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .

EXPOSE 9000

CMD ["node", "server.js"]
