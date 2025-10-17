import { Router } from "express";
import {
  getChatHistory,
  getMatches,
  getUnreadCount,
  sendMessage,
} from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const chatRouter = Router();

// All routes require authentication - they are prefixed with /api/v1/users in app.js
chatRouter.get("/fetchMatches", verifyJWT, getMatches);
chatRouter.get("/history/:otherUserId", verifyJWT, getChatHistory);
chatRouter.post("/send", verifyJWT, sendMessage);
chatRouter.get("/unread-count", verifyJWT, getUnreadCount);

export { chatRouter };
