import { extractCvText } from "./cv-service.js";

export async function ensureUploadDir() {
  const { mkdir } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const uploadDir = join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });
  return uploadDir;
}

export async function uploadCv(req, res, next) {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Missing CV file" });
      return;
    }

    const result = await extractCvText({
      filePath: req.file.path,
      originalName: req.file.originalname,
    });

    res.status(201).json({
      message: "CV uploaded",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
