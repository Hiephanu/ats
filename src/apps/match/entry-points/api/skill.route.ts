import { Router } from "express";
import multer from "multer";
import * as skillController from "../api/skill.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/import-esco", skillController.importSkillController);
router.get("/import-esco-relation", skillController.importSkillRelationController);
router.post("/import-cv", upload.single("cv"), skillController.importCvDataController);

export default router;