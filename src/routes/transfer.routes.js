import express from "express";
import {
  startTransfer,
  updateTransfer,
  completeTransfer,
  getHistory,
} from "../controllers/transfer.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/start", verifyJWT, startTransfer);
router.post("/update", verifyJWT, updateTransfer);
router.post("/complete", verifyJWT, completeTransfer);
router.get("/history", verifyJWT, getHistory);

export default router;