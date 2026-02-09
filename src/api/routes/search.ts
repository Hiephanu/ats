import express from "express";
import { searchCv } from "../../components/ai-search/search-controller.js";

const router = express.Router();

router.post("/", searchCv);

export default router;
