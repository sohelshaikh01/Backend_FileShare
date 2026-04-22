import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// 🧠 In-memory store (⚠️ replace with Redis in production)
const signalStore = {
  sessions: {
    // sessionId: {
    //   offer: { from, data },
    //   answer: { from, data },
    //   candidates: [],
    //   createdAt
    // }
  },
};

const SESSION_TTL = 1000 * 60 * 10; // 10 min

// 🔹 CLEANUP OLD SESSIONS
const cleanupSessions = () => {
  const now = Date.now();

  for (const sessionId in signalStore.sessions) {
    if (now - signalStore.sessions[sessionId].createdAt > SESSION_TTL) {
      delete signalStore.sessions[sessionId];
    }
  }
};

// 🔹 INIT SESSION (helper)
const getSession = (sessionId) => {
  if (!signalStore.sessions[sessionId]) {
    signalStore.sessions[sessionId] = {
      offer: null,
      answer: null,
      candidates: [],
      createdAt: Date.now(),
    };
  }
  return signalStore.sessions[sessionId];
};

// 🔹 SEND OFFER post - body
export const sendOffer = asyncHandler(async (req, res) => {
  const { sessionId, offer } = req.body;

  if (!sessionId || !offer) {
    throw new ApiError(400, "sessionId & offer required");
  }

  cleanupSessions();

  const session = getSession(sessionId);

  session.offer = {
    from: req.user?._id || "anonymous",
    data: offer,
  };

  return res.json(new ApiResponse(200, {}, "Offer stored"));
});

// 🔹 GET OFFER get - params
export const getOffer = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = signalStore.sessions[sessionId];
  if (!session || !session.offer) {
    throw new ApiError(404, "No offer found");
  }

  return res.json(new ApiResponse(200, session.offer));
});

// 🔹 SEND ANSWER send - body
export const sendAnswer = asyncHandler(async (req, res) => {
  const { sessionId, answer } = req.body;

  if (!sessionId || !answer) {
    throw new ApiError(400, "sessionId & answer required");
  }

  const session = getSession(sessionId);

  session.answer = {
    from: req.user?._id || "anonymous",
    data: answer,
  };

  return res.json(new ApiResponse(200, {}, "Answer stored"));
});

// 🔹 GET ANSWER get - params
export const getAnswer = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = signalStore.sessions[sessionId];
  if (!session || !session.answer) {
    throw new ApiError(404, "No answer found");
  }

  return res.json(new ApiResponse(200, session.answer));
});

// 🔹 SEND ICE CANDIDATE send - body
export const sendCandidate = asyncHandler(async (req, res) => {
  const { sessionId, candidate } = req.body;

  if (!sessionId || !candidate) {
    throw new ApiError(400, "sessionId & candidate required");
  }

  const session = getSession(sessionId);

  session.candidates.push({
    from: req.user?._id || "anonymous",
    candidate,
  });

  return res.json(new ApiResponse(200, {}, "Candidate stored"));
});


// get-params
// 🔹 GET CANDIDATES (and clear after fetch → avoids duplicates)
export const getCandidates = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = signalStore.sessions[sessionId];
  if (!session) {
    return res.json(new ApiResponse(200, []));
  }

  const candidates = session.candidates;

  // ✅ clear after sending (important)
  session.candidates = [];

  return res.json(new ApiResponse(200, candidates));
});

// 🔹 OPTIONAL: DELETE SESSION (manual cleanup)
export const clearSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  delete signalStore.sessions[sessionId];

  return res.json(new ApiResponse(200, {}, "Session cleared"));
});