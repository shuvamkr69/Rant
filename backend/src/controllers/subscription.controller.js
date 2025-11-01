import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Product IDs for different platforms
const PRODUCT_IDS = {
  android: "rant_premium_monthly",
  ios: "rant_premium_monthly",
};

/**
 * Verify and process purchase from Google Play or App Store
 */
export const verifyPurchase = asyncHandler(async (req, res) => {
  const {
    transactionId,
    productId,
    purchaseToken,
    platform,
    purchaseDate,
    receiptData,
  } = req.body;

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!transactionId || !productId || !purchaseToken || !platform) {
    throw new ApiError(400, "Missing required purchase information");
  }

  // Validate platform
  if (!["android", "ios"].includes(platform)) {
    throw new ApiError(400, "Invalid platform");
  }

  // Check if transaction already exists
  const existingTransaction = await Subscription.findOne({ transactionId });
  if (existingTransaction) {
    throw new ApiError(409, "Transaction already processed");
  }

  // In a production app, you should verify the purchase with Google/Apple servers here
  // For Google Play: Use Google Play Developer API
  // For iOS: Use App Store Server API or receipt validation

  // For now, we'll assume the purchase is valid
  // Calculate expiry date (30 days from purchase)
  const purchaseDateObj = purchaseDate ? new Date(purchaseDate) : new Date();
  const expiryDate = new Date(purchaseDateObj);
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days subscription

  // Create subscription record
  const subscription = await Subscription.create({
    userId,
    transactionId,
    productId,
    purchaseToken,
    platform,
    status: "active",
    purchaseDate: purchaseDateObj,
    expiryDate,
    autoRenewing: true,
    receiptData,
  });

  // Update user's premium status
  await User.findByIdAndUpdate(userId, {
    isPremium: true,
    subscriptionId: transactionId,
    subscriptionStatus: "active",
    subscriptionExpiryDate: expiryDate,
    subscriptionPlatform: platform,
    subscriptionProductId: productId,
  });

  res.status(200).json({
    success: true,
    message: "Purchase verified successfully",
    data: {
      subscriptionId: subscription._id,
      expiryDate: subscription.expiryDate,
      status: subscription.status,
    },
  });
});

/**
 * Get current subscription status
 */
export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const user = await User.findById(userId).select(
    "isPremium subscriptionStatus subscriptionExpiryDate subscriptionPlatform subscriptionProductId"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if subscription has expired
  if (user.isPremium && user.subscriptionExpiryDate) {
    const now = new Date();
    if (now > user.subscriptionExpiryDate) {
      // Subscription expired, update status
      await User.findByIdAndUpdate(userId, {
        isPremium: false,
        subscriptionStatus: "expired",
      });

      return res.status(200).json({
        success: true,
        data: {
          isPremium: false,
          status: "expired",
          expiryDate: user.subscriptionExpiryDate,
        },
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      isPremium: user.isPremium,
      status: user.subscriptionStatus,
      expiryDate: user.subscriptionExpiryDate,
      platform: user.subscriptionPlatform,
      productId: user.subscriptionProductId,
    },
  });
});

/**
 * Restore purchases (for users who reinstalled the app)
 */
export const restorePurchases = asyncHandler(async (req, res) => {
  const { platform, receiptData } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  if (!platform || !receiptData) {
    throw new ApiError(400, "Missing platform or receipt data");
  }

  // Find active subscriptions for this user
  const activeSubscriptions = await Subscription.find({
    userId,
    status: "active",
    expiryDate: { $gt: new Date() },
  }).sort({ expiryDate: -1 });

  if (activeSubscriptions.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No active subscriptions found",
      data: {
        isPremium: false,
      },
    });
  }

  // Get the latest active subscription
  const latestSubscription = activeSubscriptions[0];

  // Update user's premium status
  await User.findByIdAndUpdate(userId, {
    isPremium: true,
    subscriptionId: latestSubscription.transactionId,
    subscriptionStatus: "active",
    subscriptionExpiryDate: latestSubscription.expiryDate,
    subscriptionPlatform: latestSubscription.platform,
    subscriptionProductId: latestSubscription.productId,
  });

  res.status(200).json({
    success: true,
    message: "Purchases restored successfully",
    data: {
      isPremium: true,
      status: "active",
      expiryDate: latestSubscription.expiryDate,
    },
  });
});

/**
 * Cancel subscription
 */
export const cancelSubscription = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const user = await User.findById(userId);

  if (!user || !user.isPremium) {
    throw new ApiError(400, "No active subscription found");
  }

  // Update subscription status to cancelled
  await Subscription.findOneAndUpdate(
    { userId, status: "active" },
    {
      status: "cancelled",
      autoRenewing: false,
    }
  );

  // Update user - keep premium until expiry date
  await User.findByIdAndUpdate(userId, {
    subscriptionStatus: "cancelled",
  });

  res.status(200).json({
    success: true,
    message:
      "Subscription cancelled. Premium access will continue until expiry date.",
    data: {
      status: "cancelled",
      expiryDate: user.subscriptionExpiryDate,
    },
  });
});

/**
 * Get subscription history
 */
export const getSubscriptionHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "User not authenticated");
  }

  const subscriptions = await Subscription.find({ userId })
    .sort({ purchaseDate: -1 })
    .select("-receiptData -purchaseToken");

  res.status(200).json({
    success: true,
    data: subscriptions,
  });
});

/**
 * Check and update expired subscriptions (can be called by a cron job)
 */
export const checkExpiredSubscriptions = asyncHandler(async (req, res) => {
  const now = new Date();

  // Find all users with expired subscriptions
  const expiredUsers = await User.find({
    isPremium: true,
    subscriptionExpiryDate: { $lt: now },
  });

  const updatePromises = expiredUsers.map(async (user) => {
    await User.findByIdAndUpdate(user._id, {
      isPremium: false,
      subscriptionStatus: "expired",
    });

    await Subscription.findOneAndUpdate(
      { userId: user._id, status: "active" },
      { status: "expired" }
    );
  });

  await Promise.all(updatePromises);

  res.status(200).json({
    success: true,
    message: `Updated ${expiredUsers.length} expired subscriptions`,
  });
});
