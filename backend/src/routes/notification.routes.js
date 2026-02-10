import { Router } from "express";
import {
  clearAllNotifications,
  createNotification,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const notificationRouter = Router();

// All routes require authentication
notificationRouter.get("/", verifyJWT, getNotifications);
notificationRouter.get("/unread-count", verifyJWT, getUnreadCount);
notificationRouter.post("/create", verifyJWT, createNotification);
notificationRouter.put("/:notificationId/read", verifyJWT, markAsRead);
notificationRouter.put("/mark-all-read", verifyJWT, markAllAsRead);
notificationRouter.delete("/:notificationId", verifyJWT, deleteNotification);
notificationRouter.delete("/", verifyJWT, clearAllNotifications);

export { notificationRouter };
