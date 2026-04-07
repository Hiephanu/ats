import { Router } from "express";
import { matchQueryController } from "./match.controller";
const router = Router();
router.post("/query", matchQueryController.matchCandidatesByQuery);
export default router;
