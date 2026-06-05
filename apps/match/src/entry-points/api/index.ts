import { Router } from "express";
import matchRouter from "./match.route";
import skillRouter from "./skill.route";
import cvRouter from "./cv.route";

const router = Router();

router.use("/match", matchRouter);
router.use("/skills", skillRouter);
router.use("/cv", cvRouter);

export default router;