import { Router } from "express";
import {
  getChatHistory,
  getMatches,
  getUnreadCount,
  sendMessage,
} from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const chatRouter = Router();

// All routes require authentication - they will be prefixed with /chat by main router
chatRouter.get("/chat/fetchMatches", verifyJWT, getMatches);
chatRouter.get("/chat/history/:otherUserId", verifyJWT, getChatHistory);
chatRouter.post("/chat/send", verifyJWT, sendMessage);
chatRouter.get("/chat/unread-count", verifyJWT, getUnreadCount);

export { chatRouter };
