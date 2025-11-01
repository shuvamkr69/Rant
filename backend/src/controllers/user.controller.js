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
    newUser._id
  );
  console.log({ accessToken, refreshToken });

  newUser.refreshToken = refreshToken;
  await newUser.save({ validateBeforeSave: false });

  return res.status(201).json({
    message: "User registered successfully",
    user: newUser,
    accessToken,
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
    user._id
  );
  return res.status(200).json({
    message: "Login successful",
    user,
    accessToken,
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
      { new: true }
    );

    console.log(
      `✅ User ${userId} (${userName}) logged out successfully - Refresh token cleared from DB`
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
      (now - lastReset) / (1000 * 60 * 60 * 24)
    );

    // Reset if it's been 30+ days
    if (daysSinceReset >= 30) {
      stats.wordsUsedThisMonth = 0;
      stats.lastWordResetDate = now;
      await stats.save();
      console.log(`🔄 Word count reset for user ${userId}`);
    }

    res.status(200).json({
      walletBalance: stats.walletBalance,
      wordsUsed: stats.wordsUsedThisMonth,
      wordLimit: stats.monthlyWordLimit,
      wordsRemaining: stats.monthlyWordLimit - stats.wordsUsedThisMonth,
      lastWordResetDate: stats.lastWordResetDate,
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
      (now - lastReset) / (1000 * 60 * 60 * 24)
    );

    // Reset if it's been 30+ days
    if (daysSinceReset >= 30) {
      stats.wordsUsedThisMonth = 0;
      stats.lastWordResetDate = now;
      await stats.save();
    }

    res.status(200).json({
      wordsUsed: stats.wordsUsedThisMonth,
      wordLimit: stats.monthlyWordLimit,
      wordsRemaining: Math.max(
        0,
        stats.monthlyWordLimit - stats.wordsUsedThisMonth
      ),
      lastWordResetDate: stats.lastWordResetDate,
      daysUntilReset: Math.max(0, 30 - daysSinceReset),
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
      "-refreshToken -__v -updatedAt -mobileNumber"
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
