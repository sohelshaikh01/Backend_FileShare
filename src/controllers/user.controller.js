import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

// 🔐 Register
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existed = await User.findOne({ email });
  if (existed) throw new ApiError(400, "User already exists");

  const user = await User.create({ fullName, email, password });

  const safeUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(201, safeUser, "User registered"));
});

// 🔑 Login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email & password required");
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const isValid = await user.isPasswordCorrect(password);
  if (!isValid) throw new ApiError(401, "Invalid credentials");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const safeUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
      httpOnly: true,
      secure: process.env.DEV_ENV !== "development",
  }

  return res.status(200)
            .cookie("accessToken", accessToken, options)
            .json(new ApiResponse(200, {
                user: safeUser,
                accessToken,
              }, "User Logged In Successfully"));
});


const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  // ✅ proper reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpiry = Date.now() + 10 * 60 * 1000; // 10 min

  await user.save({ validateBeforeSave: false });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"FileShare" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `<a href="${resetLink}">Reset Password</a>`,
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "Reset email sent")
  );
});

// Extra things
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired token");

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;

  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Password reset successful")
  );
});

// 👤 Profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, user));
});

// 🚪 Logout
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out"));
});


export {
  registerUser,
  loginUser,
  forgetPassword,
  resetPassword,
  getUserProfile,
  logoutUser
}