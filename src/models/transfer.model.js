import mongoose, { Schema } from "mongoose";

const transferSchema = Schema(
    {
        senderId: {
                type: Schema.Types.ObjectId,
                ref: "User"
        },
        receiversId: [{
                type: Schema.Types.ObjectId,
                ref: "User"
        }],
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
        },
        progress: {
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

const Transfer = mongoose.model("Transfer", transferSchema);
export default Transfer;