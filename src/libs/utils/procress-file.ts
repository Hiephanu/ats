import fs from "fs/promises";
import pdf from "pdf-parse"; // import function trực tiếp

export const parseText = async (filePath: string): Promise<string> => {
  // đọc file PDF
  const buffer = await fs.readFile(filePath);

  // parse PDF trực tiếp
  const data = await pdf(buffer);

  // data.text đã là toàn bộ text
  return data.text.trim();
};