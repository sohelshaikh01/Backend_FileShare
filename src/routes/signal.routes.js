import express from "express";
import {
  sendOffer,
  getOffer,
  sendAnswer,
  getAnswer,
  sendCandidate,
  getCandidates,
  clearSession
} from "../controllers/signal.controller.js";

const router = express.Router();

router.post("/offer", sendOffer);
router.get("/offer/:sessionId", getOffer);

router.post("/answer", sendAnswer);
router.get("/answer/:sessionId", getAnswer);

router.post("/candidate", sendCandidate);
router.get("/candidate/:sessionId/:role", getCandidates);

router.post("/candidate/:sessionId", clearSession)

export default router;