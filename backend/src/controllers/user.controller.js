import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
export const registerUser = async (req, res) => {
  const { name, mobileNumber, userType } = req.body;

  if (!name || !mobileNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (await User.findOne({ mobileNumber })) {
    return res
      .status(409)
      .json({ message: "User with this mobile Number already exists" });
  }
  const newUser = await User.create({
    name,
    mobileNumber,
    userType: userType || "User", // Use provided userType or default to "User"
  });
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

export const fetchWalletBalance = async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ walletBalance: user.walletBalance });
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
