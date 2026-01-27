import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "inappropriate_behavior",
        "harassment",
        "spam",
        "fake_profile",
        "offensive_language",
        "other",
      ],
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
  },
  {
    timestamps: true,
  },
);

export const Report = mongoose.model("Report", reportSchema);
