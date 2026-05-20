import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const signalStore = {
	sessions: {},
};

const SESSION_TTL = 1000 * 60 * 10; // 10 minutes

const cleanupSessions = () => {
	const now = Date.now();

	for (const sessionId in signalStore.sessions) {
		const session = signalStore.sessions[sessionId];
		if (now - session.createdAt > SESSION_TTL) {
			delete signalStore.sessions[sessionId];
		}
	}
};

const getSession = (sessionId) => {
	if (!signalStore.sessions[sessionId]) {
		signalStore.sessions[sessionId] = {
			offer: null,
			answer: [], // now array
			senderCandidates: [],
			receiverCandidates: [],
			createdAt: Date.now(),
		};
	}

	return signalStore.sessions[sessionId];
};

const sendOffer = asyncHandler(async (req, res) => {
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

	return res.status(200).json(new ApiResponse(200, {}, "Offer stored"));
});


const getOffer = asyncHandler(async (req, res) => {
	const { sessionId } = req.params;

	const session = signalStore.sessions[sessionId];
	if (!session || !session.offer) {
		throw new ApiError(404, "No offer found");
	}

	return res.status(200).json(new ApiResponse(200, session.offer, "Offer found"));
});


const sendAnswer = asyncHandler(async (req, res) => {
	const { sessionId, answer } = req.body;

	if (!sessionId || !answer) {
		throw new ApiError(400, "sessionId & answer required");
	}

	cleanupSessions();
	const session = getSession(sessionId);

	const payload = {
		from: req.user?._id || "anonymous",
		data: answer,
	};

	session.answer.push(payload);

	return res.status(200).json(new ApiResponse(200, {}, "Answer stored"));
});


const getAnswer = asyncHandler(async (req, res) => {
	const { sessionId } = req.params;

	const session = signalStore.sessions[sessionId];
	if (!session || !session.answer) {
		throw new ApiError(404, "No answer found");
	}

	return res.status(200).json(new ApiResponse(200, session.answer, "Answer found"));
});


const sendCandidate = asyncHandler(async (req, res) => {
	const { sessionId, candidate, role } = req.body;

	if (!sessionId || !candidate || !role) {
		throw new ApiError(400, "sessionId, candidate & role required");
	}

	if (!["sender", "receiver"].includes(role)) {
		throw new ApiError(400, "role must be sender or receiver");
	}

	cleanupSessions();
	const session = getSession(sessionId);

	const payload = {
		from: req.user?._id || "anonymous",
		candidate,
		createdAt: Date.now(),
	};

	if (role === "sender") {
		session.senderCandidates.push(payload);
	} else {
		session.receiverCandidates.push(payload);
	}

	return res.status(200).json(new ApiResponse(200, {}, "Candidate stored"));
});


const getCandidates = asyncHandler(async (req, res) => {
	const { sessionId, role } = req.params;

	if (!["sender", "receiver"].includes(role)) {
		throw new ApiError(400, "role must be sender or receiver");
	}

	const session = signalStore.sessions[sessionId];
	if (!session) {
		return res.status(200).json(new ApiResponse(200, [], "No session found"));
	}

	const candidates =
		role === "sender" ? session.receiverCandidates : session.senderCandidates;

	const out = [...candidates];

	if (role === "sender") {
		session.receiverCandidates = [];
	} else {
		session.senderCandidates = [];
	}

	return res.status(200).json(new ApiResponse(200, out, "Candidates found"));
	// [{ from : receiver, candidate: user1 }, {}]
});


const clearSession = asyncHandler(async (req, res) => {
	const { sessionId } = req.params;

	delete signalStore.sessions[sessionId];

	return res.status(200).json(new ApiResponse(200, {}, "Session cleared"));
});


export {
	sendOffer,
	getOffer,
	sendAnswer,
	getAnswer,
	sendCandidate,
	getCandidates,
	clearSession
}