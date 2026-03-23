import { Router } from "express";
import * as skillController from "../api/skill.controller";

const router = Router();

router.get("/expand/:skillId", skillController.expandSkillController);
router.get("/path/:skillId", skillController.getAllSkillPathController);

router.get("/import-esco", skillController.importSkillController);
router.get("/import-esco-relation", skillController.importSkillRelationController);

export default router;