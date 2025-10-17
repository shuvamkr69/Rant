import { Router } from "express";
import {
  fetchWalletBalance,
  loginUser,
  registerUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/getBalance", verifyJWT, fetchWalletBalance);

export { userRouter };
