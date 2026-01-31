import express from "express";
import { normalizePdfCv } from "../domain/pdf.service.js";

const router = express.Router();

router.get("/test", async (req, res, next) => {
  try {
    const text = await normalizePdfCv(
      "C:/workspace/idea/ats/public/cv/Đoàn Văn Hiệp CV.pdf"
    );

    res.json({ content: text });
  } catch (err) {
    next(err);
  }
});

export default router;
