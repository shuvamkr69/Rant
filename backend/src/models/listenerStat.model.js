import mongoose from "mongoose";

const listenerStatsSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	uniqueUsersListenedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Track which users have been listened to
	sessionsConducted: { type: Number, default: 0 },
	totalChatTime: { type: Number, default: 0 }, // in seconds
	timeSpentListening: { type: Number, default: 0 }, // Deprecated, use totalChatTime
	sessionsCount: { type: Number, default: 0 }, // Deprecated, use sessionsConducted
	walletBalance: { type: Number, default: 0 },
	averageRating: { type: Number, default: 0 },
	totalRatings: { type: Number, default: 0 },
	reviews: [{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		rating: { type: Number, min: 1, max: 5 },
		comment: String,
		createdAt: { type: Date, default: Date.now }
	}]
}, { timestamps: true });

export const ListenerStats = mongoose.model("ListenerStats", listenerStatsSchema);