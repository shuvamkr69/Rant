import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true, // Ensure no duplicate transactions
    },
    productId: {
      type: String,
      required: true,
    },
    purchaseToken: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: ["android", "ios"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled", "refunded"],
      default: "pending",
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    autoRenewing: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
    },
    currency: {
      type: String,
    },
    originalTransactionId: {
      type: String, // For tracking renewals
    },
    receiptData: {
      type: String, // Store the complete receipt for verification
    },
  },
  { timestamps: true }
);

// Index for efficient queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ expiryDate: 1 });
subscriptionSchema.index({ transactionId: 1 });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
