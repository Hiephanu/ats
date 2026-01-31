import fs from "fs/promises";
import { PDFParse } from 'pdf-parse';

export async function normalizePdfCv(filePath) {
  const pdfData = await parseText(filePath);
  return pdfData;
}


export async function parseText(filePath) {
  const buffer = await fs.readFile(filePath);
  const uint8Array = new Uint8Array(buffer);

  const parser = new PDFParse(uint8Array);
  return await parser.getText();
}
