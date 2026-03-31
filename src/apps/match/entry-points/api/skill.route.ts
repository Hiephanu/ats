import { Router } from "express";
import * as skillController from "../api/skill.controller";

const router = Router();

router.get("/import-esco", skillController.importSkillController);
router.get("/import-esco-relation", skillController.importSkillRelationController);
router.get("/import-cv", skillController.importCvDataController);

export default router;