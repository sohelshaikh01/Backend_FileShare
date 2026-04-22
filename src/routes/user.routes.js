import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  forgetPassword,
  getUserProfile,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getUserProfile);
router.post("/forgot-password", forgetPassword);

export default router;