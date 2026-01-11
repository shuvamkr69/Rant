import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true, unique: true },
    userType: { type: String, enum: ["User", "Listener"], default: "User" },
    age: { type: Number, required: true }, // Age of the user
    bio: { type: String }, // Bio/description for Listeners
    profileImage: { type: String }, // Cloudinary URL for profile image
    timings: { type: String }, // Available timings for Listeners
    daysAvailable: { type: [String] }, // Days available for Listeners
    occupation: { type: String }, // Occupation of the Listener
    comments: { type: [String] }, // Comments for the Listener
    refreshToken: { type: String },
    // Premium subscription fields
    isPremium: { type: Boolean, default: false }, // Premium status
    subscriptionId: { type: String }, // Subscription identifier from store
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending", null],
      default: null,
    }, // Subscription status
    subscriptionExpiryDate: { type: Date }, // When the subscription expires
    subscriptionPlatform: {
      type: String,
      enum: ["android", "ios", null],
      default: null,
    }, // Platform where subscription was purchased
    subscriptionProductId: { type: String }, // Product ID from store
    pushToken: { type: String, default: null }, // Expo push notification token
  },
  { timestamps: true }
);

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
export const User = mongoose.model("User", userSchema);
