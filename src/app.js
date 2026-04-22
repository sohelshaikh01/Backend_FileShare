import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    // Allow credentials (cookies)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// configurations
app.use(cors(corsOptions));

app.use(express.json({ limit: "16kb"}));

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(express.static("public"));
app.use(cookieParser());

// Importing routes
import userRouter from "./routes/user.routes.js";
import sessionRouter from "./routes/session.routes.js";
import signalRouter from "./routes/signal.routes.js";
import transferRouter from "./routes/transfer.routes.js";
import fileRouter from "./routes/file.routes.js";

app.use("/api/v1/auth", userRouter);
app.use("/api/v1/session", sessionRouter);
app.use("/api/v1/signal", signalRouter);

app.use("/api/v1/files", fileRouter);
app.use("/api/v1/transfer", transferRouter);

export default app;