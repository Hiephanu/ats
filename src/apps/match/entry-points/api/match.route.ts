import express, { Request, Response, NextFunction, Router } from "express";
import { step1_ExtractAndSegment } from "../../domain/normalize/normalize.service.js";
import { importEscoSkills } from "../../domain/esco/esco.service.js";

const router: Router = express.Router();

// Sử dụng Type Annotation cho các tham số middleware
router.get("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // text ở đây sẽ mang kiểu ParsedCV (nếu bạn đã định nghĩa ở service)
    const text = await step1_ExtractAndSegment(
      "/Users/hiepdv/Workspace/own/ats/public/cv/Đoàn Văn Hiệp CV.pdf"
    );

    res.json({ content: text });
  } catch (err) {
    next(err);
  }
});

router.get('/esco', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const skills = await importEscoSkills(
        '/Users/hiepdv/Workspace/own/ats/data/ESCO dataset - v1.2.1 - classification - en - csv/skills_en.csv'
      );
      
      // Kiểm tra dữ liệu trước khi trả về để tránh lỗi undefined
      if (skills && skills.length > 0) {
        return res.json({ data: skills[0] });
      }
      
      return res.status(404).json({ message: "No skills found" });
    } catch (err) {
      next(err);
    }
});

export default router;