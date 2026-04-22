import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { v4 as uuid } from "uuid";

// 🧠 Temporary in-memory store (replace with DB later)
const fileStore = {};

// 🔹 INIT FILE METADATA
export const initFile = asyncHandler(async (req, res) => {
  const { fileName, fileSize, fileHash } = req.body;

  if (!fileName || !fileSize || !fileHash) {
    throw new ApiError(400, "All file fields are required");
  }

  const fileId = uuid();

  const fileMeta = {
    fileId,
    fileName,
    fileSize,
    fileHash,
    owner: req.user?._id || "anonymous",
    createdAt: Date.now(),
  };

  fileStore[fileId] = fileMeta;

  return res.status(201).json(
    new ApiResponse(201, fileMeta, "File initialized")
  );
});


// 🔹 GET FILE METADATA
export const getFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  if (!fileId) {
    throw new ApiError(400, "fileId required");
  }

  const file = fileStore[fileId];

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  // 🔐 Optional: restrict access
  // if (file.owner !== req.user._id.toString()) {
  //   throw new ApiError(403, "Unauthorized");
  // }

  return res
    .status(200)
    .json(new ApiResponse(200, file, "File fetched"));
});


// 🔹 OPTIONAL: DELETE FILE METADATA
export const deleteFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const file = fileStore[fileId];
  if (!file) throw new ApiError(404, "File not found");

  // 🔐 Only owner can delete
  if (file.owner !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized");
  }

  delete fileStore[fileId];

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "File deleted"));
});