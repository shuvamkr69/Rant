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
    preMatchMessage: {
      type: String,
      default: null,
    }, // Message sent before mutual match (only for Users to Listeners)
  },
  { timestamps: true }
);

export const Profile = mongoose.model("Profile", profileSchema);
