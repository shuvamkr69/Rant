import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
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
    requestedDate: {
      type: Date,
      required: true,
    },
    requestedTime: {
      type: String, // Format: "HH:MM"
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
      default: 60,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "rescheduled", "completed", "cancelled"],
      default: "pending",
    },
    proposedDate: {
      type: Date, // Listener's counter-proposal
    },
    proposedTime: {
      type: String, // Listener's counter-proposal time
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    sessionStartedAt: {
      type: Date,
    },
    sessionEndedAt: {
      type: Date,
    },
    actualDuration: {
      type: Number, // Actual duration in seconds
    },
    amountCharged: {
      type: Number, // Total amount charged
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
appointmentSchema.index({ userId: 1, status: 1 });
appointmentSchema.index({ listenerId: 1, status: 1 });
appointmentSchema.index({ requestedDate: 1 });

export const Appointment = mongoose.model("Appointment", appointmentSchema);
