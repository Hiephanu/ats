import { Router } from "express";
// import matchRouter from "./match.route";
import skillRouter from "./skill.route";

const router = Router();

// router.use("/match", matchRouter);
router.use("/skills", skillRouter);

export default router;