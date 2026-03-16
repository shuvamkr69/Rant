import { Router } from "express";
import {
  blockUser,
  deleteAccount,
  fetchUserProfileById,
  fetchUserStats,
  fetchWalletBalance,
  getBlockedUsers,
  getMyProfile,
  getWordCountStatus,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  removePushToken,
  updatePushToken,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router();

userRouter.post("/register", upload.single("profileImage"), registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", verifyJWT, logoutUser);
userRouter.post("/refresh-token", refreshAccessToken);
userRouter.delete("/delete-account", verifyJWT, deleteAccount);

userRouter.get("/myProfile", verifyJWT, getMyProfile);
userRouter.get("/getBalance", verifyJWT, fetchWalletBalance);
userRouter.get("/getStats", verifyJWT, fetchUserStats);
userRouter.get("/wordCount", verifyJWT, getWordCountStatus);
userRouter.get("/profile/:userId", verifyJWT, fetchUserProfileById);
userRouter.post("/update-push-token", verifyJWT, updatePushToken);
userRouter.post("/remove-push-token", verifyJWT, removePushToken);
userRouter.put(
  "/update-profile",
  verifyJWT,
  upload.single("profileImage"),
  updateUserProfile,
);

// Block routes
userRouter.post("/block/:userId", verifyJWT, blockUser);
userRouter.get("/blocked-users", verifyJWT, getBlockedUsers);

export { userRouter };
