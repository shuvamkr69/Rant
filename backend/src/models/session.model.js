import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listenerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationInSeconds: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "disconnected", "cancelled"],
      default: "active",
    },
    statsUpdated: {
      type: Boolean,
      default: false, // Prevents duplicate stat updates
    },
    // New fields for pause/resume tracking
    pausedAt: {
      type: Date,
      default: null,
    },
    totalPausedTime: {
      type: Number,
      default: 0, // in seconds
    },
    activeParticipants: {
      type: [String], // Array of user IDs currently in the session
      default: [],
    },
  },
  { timestamps: true }
);

// Index for faster queries
sessionSchema.index({ roomId: 1, status: 1 });
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ listenerId: 1, createdAt: -1 });

export const Session = mongoose.model("Session", sessionSchema);
