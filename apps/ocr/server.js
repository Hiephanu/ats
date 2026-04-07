import express from "express";
import multer from "multer";
import { createWorker } from "tesseract.js";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const PORT = process.env.OCR_PORT || 9000;
const TESSERACT_LANG = process.env.TESSERACT_LANG || "eng";

let worker = null;

async function initWorker() {
  console.log("Initializing Tesseract worker...");
  worker = await createWorker(TESSERACT_LANG, 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        process.stdout.write(".");
      }
    },
  });
  console.log(`\nTesseract worker ready (language: ${TESSERACT_LANG})`);
}

async function pdfToImages(pdfPath, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  const baseName = path.join(outputDir, "page");
  await execAsync(`pdftoppm -png -r 300 "${pdfPath}" "${baseName}"`);
  const files = await fs.readdir(outputDir);
  return files.map((f) => path.join(outputDir, f)).filter((f) => f.endsWith(".png")).sort();
}

async function extractTextFromImages(imagePaths) {
  let fullText = "";
  for (const imagePath of imagePaths) {
    const { data: { text } } = await worker.recognize(imagePath);
    fullText += text + "\n";
    await fs.unlink(imagePath);
  }
  return fullText.trim();
}

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "ocr", ready: !!worker });
});

app.post("/ocr/file", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!worker) {
    return res.status(503).json({ error: "OCR service not ready" });
  }

  try {
    const tempPath = `/tmp/ocr-${Date.now()}-${req.file.originalname}`;
    await fs.writeFile(tempPath, req.file.buffer);

    const isPdf = req.file.mimetype === "application/pdf" || 
                  req.file.originalname.toLowerCase().endsWith(".pdf");

    let text, confidence;

    if (isPdf) {
      console.log(`Processing PDF: ${req.file.originalname}`);
      const outputDir = `/tmp/ocr-pages-${Date.now()}`;
      const imagePaths = await pdfToImages(tempPath, outputDir);
      
      if (imagePaths.length === 0) {
        throw new Error("Failed to convert PDF to images");
      }

      console.log(`Converted to ${imagePaths.length} image(s)`);
      text = await extractTextFromImages(imagePaths);
      confidence = 0;
      await fs.rmdir(outputDir, { recursive: true });
    } else {
      const result = await worker.recognize(tempPath);
      text = result.data.text;
      confidence = result.data.confidence;
    }

    await fs.unlink(tempPath);

    res.json({
      text,
      confidence,
      language: TESSERACT_LANG,
      filename: req.file.originalname,
      isPdf,
    });
  } catch (error) {
    console.error("OCR error:", error);
    res.status(500).json({ error: `OCR processing failed: ${error.message}` });
  }
});

app.post("/ocr/base64", async (req, res) => {
  const { image, language } = req.body;

  if (!image) {
    return res.status(400).json({ error: "No image data provided" });
  }

  if (!worker) {
    return res.status(503).json({ error: "OCR service not ready" });
  }

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const tempPath = `/tmp/ocr-${Date.now()}.png`;

    await fs.writeFile(tempPath, buffer);

    const { data: { text, confidence } } = await worker.recognize(tempPath);

    await fs.unlink(tempPath);

    res.json({
      text,
      confidence,
      language: language || TESSERACT_LANG
    });
  } catch (error) {
    console.error("OCR error:", error);
    res.status(500).json({ error: "OCR processing failed" });
  }
});

app.post("/ocr/url", async (req, res) => {
  const { url, language } = req.body;

  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  if (!worker) {
    return res.status(503).json({ error: "OCR service not ready" });
  }

  try {
    const tempPath = `/tmp/ocr-${Date.now()}.png`;

    await fs.writeFile(tempPath, Buffer.from(await fetch(url).then(r => r.arrayBuffer())));

    const { data: { text, confidence } } = await worker.recognize(tempPath);

    await fs.unlink(tempPath);

    res.json({
      text,
      confidence,
      language: language || TESSERACT_LANG,
      sourceUrl: url
    });
  } catch (error) {
    console.error("OCR error:", error);
    res.status(500).json({ error: "OCR processing failed" });
  }
});

app.post("/ocr/cli", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const tempPath = `/tmp/ocr-${Date.now()}-${req.file.originalname}`;
    await fs.writeFile(tempPath, req.file.buffer);

    const isPdf = req.file.mimetype === "application/pdf" || 
                  req.file.originalname.toLowerCase().endsWith(".pdf");

    let text;

    if (isPdf) {
      const outputDir = `/tmp/ocr-pages-${Date.now()}`;
      const imagePaths = await pdfToImages(tempPath, outputDir);
      text = await extractTextFromImages(imagePaths);
      await fs.rmdir(outputDir, { recursive: true });
    } else {
      const { stdout } = await execAsync(`tesseract ${tempPath} stdout -l ${TESSERACT_LANG}`);
      text = stdout.trim();
    }

    await fs.unlink(tempPath);

    res.json({
      text,
      language: TESSERACT_LANG,
      method: "cli",
      filename: req.file.originalname,
      isPdf,
    });
  } catch (error) {
    console.error("OCR CLI error:", error);
    res.status(500).json({ error: `OCR CLI processing failed: ${error.message}` });
  }
});

async function start() {
  await initWorker();

  app.listen(PORT, () => {
    console.log(`OCR service running on port ${PORT}`);
  });
}

start().catch(console.error);
