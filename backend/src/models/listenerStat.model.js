import mongoose from "mongoose";

const listenerStatsSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	messagesListened: { type: Number, default: 0 },
	timeSpentListening: { type: Number, default: 0 },
	sessionsCount: { type: Number, default: 0 },
	walletBalance: { type: Number, default: 0 },
}, { timestamps: true });

export const ListenerStats = mongoose.model("ListenerStats", listenerStatsSchema);