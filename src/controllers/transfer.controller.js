import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

import Transfer from "../models/transfer.model.js";

// 🔹 START TRANSFER
const startTransfer = asyncHandler(async (req, res) => {
  const { receiversId, fileMeta } = req.body;

  if(!receiversId || !fileMeta ) {
    throw new ApiError(400, "Receivers and File Metadata is required");
  }

  const transfer = await Transfer.create({
    senderId: req.user?._id,
    receiversId,
    fileMeta,
    status: "started"
  });

  return res.status(201)
            .json(new ApiResponse(201, transfer, "Transfer started"));
});

const updateTransfer = asyncHandler(async (req, res) => {
  const { transferId, progress } = req.body;

  if(!transferId || !progress) {
    throw new ApiError(400, "TransferId and progress required");
  }

  const transfer = await Transfer.findById(transferId);
  
  if(!transfer) throw new ApiError(404, "Transfer not found");

  if(transfer.senderId.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "Unauthorized");
  }

  if(progress === 0) transfer.status = "started";
  if(progress > 0 && progress < 100)transfer.status = "incompleted";
  if(progress === 100) transfer.status = "completed";

  await transfer.save();

  return res.status(200)
            .json(new ApiResponse(200, transfer, "Transfer Updated"));
});

const completeTransfer = asyncHandler(async (req, res) => {
  const { transferId } = req.body;

  if(!transferId) {
    throw new ApiError(400, "TransferId required");
  }

  const transfer = await Transfer.findById(transferId);

  if(!transfer) throw new ApiError(404, "Transfer not found");

  if(transfer.senderId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only sender can complete transfer");
  }

  transfer.status = "completed";
  await transfer.save();

  return res.status(200)
            .json(new ApiResponse(200, transfer, "Transfer completed"));
});

const getHistory = asyncHandler(async(req, res) => {

  const sentFiles = await Transfer.find({
    senderId: req.user._id
  })
    .sort({ createdAt: -1 })
    .lean()
    .select("senderId receiversId fileMeta status createdAt");

  const receivedFiles = await Transfer.find({
    receiversId: req.user._id
  })
    .sort({ createdAt: -1 })
    .lean()
    .select("senderId receiversId fileMeta status createdAt");

  return res.status(200)
            .json(new ApiResponse(200, { sentFiles, receivedFiles }, "Transfer history"));

}); 


export {
  startTransfer,
  updateTransfer,
  completeTransfer,
  getHistory
}