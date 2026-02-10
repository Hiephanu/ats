import { Router } from "express";
import matchRoutes from "./match.route.js";

const router: Router = Router();

router.use("/", matchRoutes);

export default router;