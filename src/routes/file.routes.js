import express from "express";
import { initFile, getFile } from "../controllers/file.controller.js";

const router = express.Router();

router.post("/init", initFile);
router.get("/:fileId", getFile);

export default router;