import mongoose, { Schema } from "mongoose";

const sessionSchema = Schema(
    {
        sessionCode: {
            type: Number,
            required: true,
            trim: true,
        },
        senderId: {
                type: Schema.Types.ObjectId,
                ref: "User"
        },
        // receivers array
        receivers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        fileMeta: {
            fileName: String,
            fileSize: Number,
            fileHash: String
        },
        status: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        }
    },
    {
        timestamps: true
    }
);

const Session = mongoose.model("Session", sessionSchema); 
export default Session;