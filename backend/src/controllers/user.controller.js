import jwt from "jsonwebtoken";
import { ListenerStats } from "../models/listenerStat.model.js";
import { User } from "../models/user.model.js";
import { UserStats } from "../models/userStats.model.js";
import { ApiError } from "../utils/apiError.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

// Fetch stats for the current user (for MyProfile)
export const fetchUserStats = async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  let stats = null;
  if (user.userType === "Listener") {
    stats = await ListenerStats.findOne({ userId });
    // Create stats if they don't exist
    if (!stats) {
      stats = await ListenerStats.create({ userId });
      console.log(`✅ Created new ListenerStats for ${userId}`);
    }
  } else {
    stats = await UserStats.findOne({ userId });
    // Create stats if they don't exist
    if (!stats) {
      stats = await UserStats.create({ userId });
      console.log(`✅ Created new UserStats for ${userId}`);
    }
  }
  res.status(200).json({ userType: user.userType, stats });
};

export const registerUser = async (req, res) => {
  const {
    name,
    mobileNumber,
    userType,
    age,
    bio,
    occupation,
    daysAvailable,
    timings,
  } = req.body;

  if (!name || !mobileNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!age || age < 18) {
    return res
      .status(400)
      .json({ message: "You must be at least 18 years old to register." });
  }

  if (await User.findOne({ mobileNumber })) {
    return res
      .status(409)
      .json({ message: "User with this mobile Number already exists" });
  }

  // Handle profile image upload if provided
  let profileImageUrl = null;
  if (req.file) {
    profileImageUrl = await uploadToCloudinary(req.file.path, "profiles");
  }

  // Parse daysAvailable if it's a string (from FormData)
  let parsedDaysAvailable = [];
  if (daysAvailable) {
    try {
      parsedDaysAvailable =
        typeof daysAvailable === "string"
          ? JSON.parse(daysAvailable)
          : daysAvailable;
    } catch (error) {
      console.error("Error parsing daysAvailable:", error);
    }
  }

  const newUser = await User.create({
    name,
    mobileNumber,
    userType: userType || "User",
    age,
    bio,
    occupation,
    profileImage: profileImageUrl,
    daysAvailable: parsedDaysAvailable,
    timings,
  });

  // Create stats document for the new user
  if ((userType || "User") === "Listener") {
    await ListenerStats.create({ userId: newUser._id });
  } else {
    await UserStats.create({ userId: newUser._id });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    newUser._id,
  );
  console.log({ accessToken, refreshToken });

  newUser.refreshToken = refreshToken;
  await newUser.save({ validateBeforeSave: false });

  return res.status(201).json({
    message: "User registered successfully",
    user: newUser,
    accessToken,
    refreshToken,
  });
};

export const loginUser = async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) {
    return res.status(400).json({ message: "mobile Number is required" });
  }
  const user = await User.findOne({ mobileNumber });
  if (!user || user.mobileNumber !== mobileNumber) {
    return res.status(401).json({ message: "Invalid mobile Number" });
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );
  console.log({ accessToken });
  return res.status(200).json({
    message: "Login successful",
    user,
    accessToken,
    refreshToken,
  });
};

export const logoutUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const userName = req.user.name;
    const userType = req.user.userType;

    console.log(`🔓 LOGOUT REQUEST RECEIVED`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`📛 User Name: ${userName}`);
    console.log(`🏷️  User Type: ${userType}`);

    // Clear the refresh token from the database
    await User.findByIdAndUpdate(
      userId,
      { $unset: { refreshToken: "" } },
      { new: true },
    );

    console.log(
      `✅ User ${userId} (${userName}) logged out successfully - Refresh token cleared from DB`,
    );

    return res.status(200).json({
      message: "Logged out successfully",
      userId: userId.toString(),
      userName,
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    return res.status(500).json({ message: "Failed to logout" });
  }
};

export const fetchWalletBalance = async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  let stats = null;
  if (user.userType === "Listener") {
    stats = await ListenerStats.findOne({ userId });
    // Create stats if they don't exist
    if (!stats) {
      stats = await ListenerStats.create({ userId });
      console.log(`✅ Created new ListenerStats for ${userId}`);
    }
    res.status(200).json({ walletBalance: stats.walletBalance });
  } else {
    stats = await UserStats.findOne({ userId });
    // Create stats if they don't exist
    if (!stats) {
      stats = await UserStats.create({ userId });
      console.log(`✅ Created new UserStats for ${userId}`);
    }

    // Check if monthly limit needs reset
    const now = new Date();
    const lastReset = new Date(stats.lastWordResetDate);
    const daysSinceReset = Math.floor(
      (now - lastReset) / (1000 * 60 * 60 * 24),
    );

    // Reset if it's been 30+ days
    if (daysSinceReset >= 30) {
      stats.wordsUsedThisMonth = 0;
      stats.lastWordResetDate = now;
      await stats.save();
      console.log(`🔄 Word count reset for user ${userId}`);
    }

    // Check if user has active premium subscription
    const isPremium = user.isPremium && user.subscriptionStatus === "active";
    const wordLimit = isPremium ? -1 : stats.monthlyWordLimit; // -1 means unlimited
    const wordsRemaining = isPremium
      ? -1
      : stats.monthlyWordLimit - stats.wordsUsedThisMonth;

    res.status(200).json({
      walletBalance: stats.walletBalance,
      wordsUsed: stats.wordsUsedThisMonth,
      wordLimit: wordLimit,
      wordsRemaining: wordsRemaining,
      lastWordResetDate: stats.lastWordResetDate,
      isPremium: isPremium,
    });
  }
};

// Get word count status for user
export const getWordCountStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only applicable for "User" type, not "Listener"
    if (user.userType !== "User") {
      return res
        .status(400)
        .json({ message: "Word limits only apply to Users, not Listeners" });
    }

    let stats = await UserStats.findOne({ userId });
    if (!stats) {
      stats = await UserStats.create({ userId });
    }

    // Check if monthly limit needs reset
    const now = new Date();
    const lastReset = new Date(stats.lastWordResetDate);
    const daysSinceReset = Math.floor(
      (now - lastReset) / (1000 * 60 * 60 * 24),
    );

    // Reset if it's been 30+ days
    if (daysSinceReset >= 30) {
      stats.wordsUsedThisMonth = 0;
      stats.lastWordResetDate = now;
      await stats.save();
    }

    // Check if user has active premium subscription
    const isPremium = user.isPremium && user.subscriptionStatus === "active";
    const wordLimit = isPremium ? -1 : stats.monthlyWordLimit; // -1 means unlimited
    const wordsRemaining = isPremium
      ? -1
      : Math.max(0, stats.monthlyWordLimit - stats.wordsUsedThisMonth);

    res.status(200).json({
      wordsUsed: stats.wordsUsedThisMonth,
      wordLimit: wordLimit,
      wordsRemaining: wordsRemaining,
      lastWordResetDate: stats.lastWordResetDate,
      daysUntilReset: Math.max(0, 30 - daysSinceReset),
      isPremium: isPremium,
    });
  } catch (error) {
    console.error("❌ Error fetching word count status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch another user's profile by ID
export const fetchUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId).select(
      "-refreshToken -__v -updatedAt -mobileNumber",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updatePushToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ message: "Push token is required" });
    }

    await User.findByIdAndUpdate(userId, { pushToken });

    console.log(`✅ Push token updated for user ${userId}`);
    res.status(200).json({ message: "Push token updated successfully" });
  } catch (error) {
    console.error("❌ Error updating push token:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const removePushToken = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { pushToken: null });

    console.log(`✅ Push token removed for user ${userId}`);
    res.status(200).json({ message: "Push token removed successfully" });
  } catch (error) {
    console.error("❌ Error removing push token:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    // Find user and verify the refresh token matches what's stored
    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    console.log(
      `🔄 Access token refreshed for user ${user._id} (${user.name})`,
    );

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`🗑️ Delete account requested for user: ${userId}`);

    // Import necessary models
    const { Message } = await import("../models/message.model.js");
    const { Profile } = await import("../models/profile.model.js");
    const { Session } = await import("../models/session.model.js");
    const { Subscription } = await import("../models/subscription.model.js");

    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(
      `📊 Starting deletion process for ${user.name} (${user.userType})`,
    );

    // Delete all related data
    // 1. Delete messages where user is sender or receiver
    const messagesDeleted = await Message.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });
    console.log(`✅ Deleted ${messagesDeleted.deletedCount} messages`);

    // 2. Delete profiles where user is involved
    const profilesDeleted = await Profile.deleteMany({
      $or: [{ userId: userId }, { listenerId: userId }],
    });
    console.log(`✅ Deleted ${profilesDeleted.deletedCount} profiles/matches`);

    // 3. Delete sessions where user participated
    const sessionsDeleted = await Session.deleteMany({
      $or: [{ userId: userId }, { listenerId: userId }],
    });
    console.log(`✅ Deleted ${sessionsDeleted.deletedCount} sessions`);

    // 4. Delete subscriptions
    const subscriptionsDeleted = await Subscription.deleteMany({ userId });
    console.log(
      `✅ Deleted ${subscriptionsDeleted.deletedCount} subscriptions`,
    );

    // 5. Delete user stats
    if (user.userType === "Listener") {
      const listenerStatsDeleted = await ListenerStats.deleteOne({ userId });
      console.log(
        `✅ Deleted listener stats: ${listenerStatsDeleted.deletedCount}`,
      );
    } else {
      const userStatsDeleted = await UserStats.deleteOne({ userId });
      console.log(`✅ Deleted user stats: ${userStatsDeleted.deletedCount}`);
    }

    // 6. Finally, delete the user account
    await User.findByIdAndDelete(userId);
    console.log(`✅ User account deleted: ${userId}`);

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully. All your data has been removed.",
    });
  } catch (error) {
    console.error("❌ Error deleting account:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

// Get current user's profile
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("❌ [Get My Profile] Error:", error);
    return res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, age, bio, occupation, daysAvailable, timings } = req.body;

    console.log("🔵 [Update Profile] Request received:", {
      userId,
      body: req.body,
      hasFile: !!req.file,
    });

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update object
    const updateData = {};

    // Update basic fields if provided
    if (name) updateData.name = name;
    if (age) {
      const parsedAge = parseInt(age);
      if (parsedAge < 18) {
        return res.status(400).json({ message: "Age must be at least 18" });
      }
      updateData.age = parsedAge;
    }
    if (bio !== undefined) updateData.bio = bio;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (timings !== undefined) updateData.timings = timings;

    // Parse and update daysAvailable if provided
    if (daysAvailable !== undefined) {
      try {
        updateData.daysAvailable =
          typeof daysAvailable === "string"
            ? JSON.parse(daysAvailable)
            : daysAvailable;
      } catch (error) {
        console.error("Error parsing daysAvailable:", error);
        return res
          .status(400)
          .json({ message: "Invalid daysAvailable format" });
      }
    }

    // Handle profile image upload if provided
    if (req.file) {
      console.log("🔵 [Update Profile] Uploading new profile image...");
      const profileImageUrl = await uploadToCloudinary(
        req.file.path,
        "profiles",
      );
      updateData.profileImage = profileImageUrl;
      console.log(
        "✅ [Update Profile] Profile image uploaded:",
        profileImageUrl,
      );
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-refreshToken");

    console.log("✅ [Update Profile] Profile updated successfully");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ [Update Profile] Error:", error);
    return res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token Generation Error:", error);
    throw new ApiError(500, "Refresh and Access Token generation failed");
  }
};

/**
 * Block a user - adds them to the current user's blockedUsers list
 * and removes all match records (Profile) between the two users.
 */
export const blockUser = async (req, res) => {
  try {
    const blockerId = req.user._id;
    const { userId: blockedId } = req.params;

    if (!blockedId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (blockerId.toString() === blockedId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const blockedUser = await User.findById(blockedId);
    if (!blockedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add to blocker's blockedUsers list if not already there
    await User.findByIdAndUpdate(blockerId, {
      $addToSet: { blockedUsers: blockedId },
    });

    // Remove all Profile (match) records between the two users so they
    // no longer appear in each other's matches or swipe deck
    const { Profile } = await import("../models/profile.model.js");
    await Profile.deleteMany({
      $or: [
        { userId: blockerId, otherUserId: blockedId },
        { userId: blockedId, otherUserId: blockerId },
      ],
    });

    console.log(`🚫 User ${blockerId} blocked ${blockedId}`);

    return res.status(200).json({
      success: true,
      message: `You have blocked ${blockedUser.name}`,
    });
  } catch (error) {
    console.error("❌ Error blocking user:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

/**
 * Get the list of users blocked by the current user
 */
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("blockedUsers")
      .populate("blockedUsers", "name userType profileImage");

    return res.status(200).json({ blockedUsers: user?.blockedUsers || [] });
  } catch (error) {
    console.error("❌ Error fetching blocked users:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
