import { Router } from "express";
import {
    fetchUserStats,
    fetchWalletBalance,
    loginUser,
    registerUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/getBalance", verifyJWT, fetchWalletBalance);
userRouter.get("/getStats", verifyJWT, fetchUserStats);

export { userRouter };
