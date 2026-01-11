import { Router } from "express";
import {
  fetchUserProfileById,
  fetchUserStats,
  fetchWalletBalance,
  getWordCountStatus,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  removePushToken,
  updatePushToken,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router();

userRouter.post("/register", upload.single("profileImage"), registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", verifyJWT, logoutUser);
userRouter.post("/refresh-token", refreshAccessToken);

userRouter.get("/getBalance", verifyJWT, fetchWalletBalance);
userRouter.get("/getStats", verifyJWT, fetchUserStats);
userRouter.get("/wordCount", verifyJWT, getWordCountStatus);
userRouter.get("/profile/:userId", verifyJWT, fetchUserProfileById);
userRouter.post("/update-push-token", verifyJWT, updatePushToken);
userRouter.post("/remove-push-token", verifyJWT, removePushToken);

export { userRouter };
