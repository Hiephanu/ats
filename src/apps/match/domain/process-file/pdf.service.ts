import fs from "fs/promises";
// @ts-ignore: pdf-parse might not have types for this specific usage
import { PDFParse } from 'pdf-parse';

/**
 * Định nghĩa Interface dựa trên cấu trúc trả về của thư viện bạn đang dùng
 */
interface PDFParseResult {
  pages: Array<{
    text: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export const parseText = async (filePath: string): Promise<PDFParseResult> => {
  const buffer = await fs.readFile(filePath);
  const uint8Array = new Uint8Array(buffer);

  const parser = new (PDFParse as any)(uint8Array);
  return await parser.getText();
};