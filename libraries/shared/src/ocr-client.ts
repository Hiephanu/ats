const DEFAULT_OCR_URL = process.env.OCR_URL || "http://localhost:9000";

export interface OcrResult {
  text: string;
  confidence: number;
  language: string;
  filename?: string;
  sourceUrl?: string;
  isPdf?: boolean;
}

export interface StorageDownload {
  download(key: string): Promise<Buffer>;
}

export interface OcrClient {
  recognizeFromFile(buffer: Buffer, filename: string): Promise<OcrResult>;
  recognizeFromBase64(base64: string, language?: string): Promise<OcrResult>;
  recognizeFromUrl(url: string, language?: string): Promise<OcrResult>;
  recognizeFromS3(s3Key: string, storage: StorageDownload): Promise<OcrResult>;
  healthCheck(): Promise<boolean>;
}

export function createOcrClient(url: string = DEFAULT_OCR_URL): OcrClient {
  const baseUrl = url.replace(/\/$/, "");

  return {
    async recognizeFromFile(buffer: Buffer, filename: string): Promise<OcrResult> {
      const formData = new FormData();
      const blob = new Blob([buffer]);
      formData.append("image", blob, filename);

      const response = await fetch(`${baseUrl}/ocr/file`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR failed: ${response.statusText}`);
      }

      return response.json() as Promise<OcrResult>;
    },

    async recognizeFromBase64(base64: string, language?: string): Promise<OcrResult> {
      const response = await fetch(`${baseUrl}/ocr/base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, language }),
      });

      if (!response.ok) {
        throw new Error(`OCR failed: ${response.statusText}`);
      }

      return response.json() as Promise<OcrResult>;
    },

    async recognizeFromUrl(url: string, language?: string): Promise<OcrResult> {
      const response = await fetch(`${baseUrl}/ocr/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, language }),
      });

      if (!response.ok) {
        throw new Error(`OCR failed: ${response.statusText}`);
      }

      return response.json() as Promise<OcrResult>;
    },

    async recognizeFromS3(s3Key: string, storage: { download: (key: string) => Promise<Buffer> }): Promise<OcrResult> {
      const buffer = await storage.download(s3Key);
      const filename = s3Key.split("/").pop() || "file.pdf";
      return this.recognizeFromFile(buffer, filename);
    },

    async healthCheck(): Promise<boolean> {
      try {
        const response = await fetch(`${baseUrl}/health`);
        if (!response.ok) return false;
        const data = await response.json() as { ready?: boolean };
        return data.ready === true;
      } catch {
        return false;
      }
    },
  };
}
