import Session from "../models/session.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// 🔹 Generate unique 6-digit code
const generateSessionCode = async () => {
  let code;
  let exists = true;

  while (exists) {
	code = Math.floor(100000 + Math.random() * 900000).toString();
	exists = await Session.findOne({ sessionCode: code });
  }

  // complexity check each time code
  return code;
};


// 🔹 CREATE SESSION - fMT body
const createSession = asyncHandler(async (req, res) => {
  const { fileMeta } = req.body;

  if(!fileMeta) {
	throw new ApiError(400, "File metadata required");
  }

  const sessionCode = await generateSessionCode();

  const session = await Session.create({
	sessionCode: Number(sessionCode),
	senderId: req.user?._id, // sender side
	receivers: [],
	fileMeta,
	status: "active"
  });

  return res.status(201)
			.json(new ApiResponse(201, session, "New Session Created Successfully"));
});


// 🔹 GET SESSION (by ID) - sCD body
const getSession = asyncHandler(async (req, res) => {
  const { sessionCode } = req.body;

  const session = await Session.findOne({ sessionCode })
	.populate("senderId", "fullName email")
	.populate("receivers", "fullName email");

  if (!session) throw new ApiError(404, "Session not found");

  return res
	.status(200)
	.json(new ApiResponse(200, session, "Session Fetched Successfully"));
});


// 🔹 JOIN SESSION (by CODE) - sCD body
const joinSession = asyncHandler(async (req, res) => {
  const { sessionCode } = req.body;

  if (!sessionCode) {
	throw new ApiError(400, "Session code required");
  }

  const session = await Session.findOne({ sessionCode });

  if (!session) throw new ApiError(404, "Session not exits");

  if (session.status !== "active") {
	throw new ApiError(400, "Session not active");
  }

  if (session.receivers.length >= 5) {
	throw new ApiError(400, "Max users reached");
  }

  // ✅ proper ObjectId check
  const alreadyJoined = session.receivers.some(
	(id) => id.toString() === req.user._id.toString()
  );

  if (!alreadyJoined) {
	session.receivers.push(req.user._id);
	await session.save();
  }

  return res
	.status(200)
	.json(new ApiResponse(200, session, "Joined session"));
});

// Delete only sender - sID params
const deleteSession = asyncHandler(async(req, res) => {
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if(!session) throw new ApiError(404, "Session not exists");

  if(session.senderId.toString() !== req.user._id.toString()) {
	throw new ApiError(403, "Unauthrized to delete session");
  }

  await session.deleteOne();

  return res.status(200)
			.json(new ApiResponse(200, {}, "Session deleted"));

});

export {
  createSession,
  getSession,
  joinSession,
  deleteSession
}