import { Router } from "express";
import multer from "multer";
import { cvController } from "./cv.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
});

const router = Router();

router.post("/upload", upload.single("file"), cvController.upload);
router.get("/candidates", cvController.list);
router.get("/candidates/:id", cvController.getById);

export default router;
