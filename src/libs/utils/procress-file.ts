import fs from "fs/promises";
// @ts-ignore: pdf-parse might not have types for this specific usage
import { PDFParse } from 'pdf-parse';

export const parseText = async (filePath: string): Promise<string> => {
  const buffer = await fs.readFile(filePath);
  const uint8Array = new Uint8Array(buffer);

  const parser = new (PDFParse as any)(uint8Array);
  const result = await parser.getText();

  // flatten toàn bộ pages → text
  const fullText = result.pages
    .map((p: { text: string }) => p.text)
    .join("\n");

  return fullText.trim();
};