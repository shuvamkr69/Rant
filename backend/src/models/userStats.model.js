import mongoose from "mongoose";

const userStatsSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	messagesSent: { type: Number, default: 0 },
	messagesReceived: { type: Number, default: 0 },
	chatsParticipated: { type: Number, default: 0 },
	totalSessionTime: { type: Number, default: 0 }, // in seconds
	sessionsCompleted: { type: Number, default: 0 },
	walletBalance: { type: Number, default: 0 },
	
	// Freemium model fields
	wordsUsedThisMonth: { type: Number, default: 0 }, // Words sent this month
	monthlyWordLimit: { type: Number, default: 10000 }, // Free tier limit
	lastWordResetDate: { type: Date, default: Date.now }, // Track when to reset monthly limit
}, { timestamps: true });

export const UserStats = mongoose.model("UserStats", userStatsSchema);