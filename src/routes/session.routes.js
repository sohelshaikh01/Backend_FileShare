import express from "express";
import {
  createSession,
  getSession,
  joinSession,
  deleteSession,
} from "../controllers/session.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", verifyJWT, createSession);
router.post("/", verifyJWT, getSession);
router.post("/join", verifyJWT, joinSession);
router.delete("/:sessionId", verifyJWT, deleteSession);

export default router;