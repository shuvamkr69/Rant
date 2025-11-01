import { Router } from "express";
import {
  cancelSubscription,
  checkExpiredSubscriptions,
  getSubscriptionHistory,
  getSubscriptionStatus,
  restorePurchases,
  verifyPurchase,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// Verify a new purchase
router.post("/verify", verifyPurchase);

// Get current subscription status
router.get("/status", getSubscriptionStatus);

// Restore previous purchases
router.post("/restore", restorePurchases);

// Cancel subscription
router.post("/cancel", cancelSubscription);

// Get subscription history
router.get("/history", getSubscriptionHistory);

// Check and update expired subscriptions (can be called by cron)
router.post("/check-expired", checkExpiredSubscriptions);

export default router;
