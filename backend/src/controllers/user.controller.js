import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (await User.findOne({ email })) {
    return res
      .status(409)
      .json({ message: "User with this email already exists" });
  }
  const newUser = await User.create({ name, email, password });
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
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const user = await User.findOne({ email });
  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid email or password" });
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
