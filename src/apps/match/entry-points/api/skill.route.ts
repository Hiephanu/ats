import { Router } from "express";
import * as skillController from "../api/skill.controller";

const router = Router();

router.get("/resolve", skillController.resolveSkillController);

export default router;