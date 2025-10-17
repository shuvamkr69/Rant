import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otherUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Status: { type: String, enum: ["accepted", "rejected"], required: true },
  },
  { timestamps: true }
);

export const Profile = mongoose.model("Profile", profileSchema);
