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
  console.log("\n========================================");
  console.log("🔵 [Backend] verifyPurchase called");
  console.log("🔵 [Backend] Timestamp:", new Date().toISOString());
  console.log(
    "🔵 [Backend] Request headers:",
    JSON.stringify(
      {
        authorization: req.headers.authorization ? "Bearer ***" : "MISSING",
        contentType: req.headers["content-type"],
        userAgent: req.headers["user-agent"],
      },
      null,
      2
    )
  );
  console.log("🔵 [Backend] Request body:", JSON.stringify(req.body, null, 2));

  const {
    transactionId,
    productId,
    purchaseToken,
    platform,
    purchaseDate,
    receiptData,
  } = req.body;

  const userId = req.user?._id;
  console.log("🔵 [Backend] User ID from token:", userId);
  console.log("🔵 [Backend] User object exists:", !!req.user);
  console.log(
    "🔵 [Backend] Full req.user object:",
    JSON.stringify(req.user, null, 2)
  );

  if (!userId) {
    console.error(
      "❌ [Backend] AUTHENTICATION FAILED - User not authenticated"
    );
    console.error("❌ [Backend] req.user is:", req.user);
    throw new ApiError(401, "User not authenticated");
  }
  console.log("✅ [Backend] Authentication successful");

  // Verify user exists in database before proceeding
  console.log("🔵 [Backend] Verifying user exists in database...");
  const userExists = await User.findById(userId);
  if (!userExists) {
    console.error(
      "❌ [Backend] ERROR - User ID from token not found in database!"
    );
    console.error("❌ [Backend] User ID:", userId);
    console.error(
      "❌ [Backend] This means the token contains an invalid user ID"
    );
    throw new ApiError(404, "User not found in database. Please log in again.");
  }
  console.log("✅ [Backend] User found in database:", {
    userId: userExists._id,
    email: userExists.email,
    username: userExists.username,
    isPremium: userExists.isPremium,
  });

  console.log("🔵 [Backend] Validating request data...");
  if (!transactionId || !productId || !purchaseToken || !platform) {
    console.error(
      "❌ [Backend] VALIDATION FAILED - Missing required purchase information:",
      {
        hasTransactionId: !!transactionId,
        transactionId: transactionId || "MISSING",
        hasProductId: !!productId,
        productId: productId || "MISSING",
        hasPurchaseToken: !!purchaseToken,
        purchaseToken: purchaseToken
          ? purchaseToken.substring(0, 20) + "..."
          : "MISSING",
        hasPlatform: !!platform,
        platform: platform || "MISSING",
      }
    );
    throw new ApiError(400, "Missing required purchase information");
  }
  console.log("✅ [Backend] All required fields present");

  // Validate platform
  if (!["android", "ios"].includes(platform)) {
    console.error(
      "❌ [Backend] VALIDATION FAILED - Invalid platform:",
      platform
    );
    throw new ApiError(400, "Invalid platform");
  }
  console.log("✅ [Backend] Platform validated:", platform);

  console.log("🔵 [Backend] Checking for existing transaction in database...");
  console.log("🔵 [Backend] Searching for transaction ID:", transactionId);
  // Check if transaction already exists
  const existingTransaction = await Subscription.findOne({ transactionId });
  if (existingTransaction) {
    console.warn(
      "⚠️ [Backend] DUPLICATE TRANSACTION - Transaction already processed!"
    );
    console.warn("⚠️ [Backend] Existing transaction:", {
      _id: existingTransaction._id,
      userId: existingTransaction.userId,
      createdAt: existingTransaction.createdAt,
      status: existingTransaction.status,
    });
    throw new ApiError(409, "Transaction already processed");
  }
  console.log("✅ [Backend] Transaction is new - proceeding with creation");

  // In a production app, you should verify the purchase with Google/Apple servers here
  // For Google Play: Use Google Play Developer API
  // For iOS: Use App Store Server API or receipt validation

  console.log("🔵 [Backend] Calculating expiry date...");
  // For now, we'll assume the purchase is valid
  // Calculate expiry date (30 days from purchase)
  const purchaseDateObj = purchaseDate ? new Date(purchaseDate) : new Date();
  const expiryDate = new Date(purchaseDateObj);
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days subscription
  console.log("🔵 [Backend] Purchase date:", purchaseDateObj);
  console.log("🔵 [Backend] Expiry date:", expiryDate);

  console.log("🔵 [Backend] Creating subscription record in database...");
  console.log("🔵 [Backend] Subscription data:", {
    userId,
    transactionId,
    productId,
    purchaseToken: purchaseToken.substring(0, 20) + "...",
    platform,
    status: "active",
    purchaseDate: purchaseDateObj,
    expiryDate,
    autoRenewing: true,
  });

  try {
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
    console.log("✅ [Backend] Subscription record created successfully!");
    console.log("✅ [Backend] Subscription ID:", subscription._id);
    console.log("✅ [Backend] Subscription details:", {
      _id: subscription._id,
      userId: subscription.userId,
      status: subscription.status,
      expiryDate: subscription.expiryDate,
    });

    console.log("🔵 [Backend] Updating user document with premium status...");
    console.log("🔵 [Backend] User update data:", {
      isPremium: true,
      subscriptionId: transactionId,
      subscriptionStatus: "active",
      subscriptionExpiryDate: expiryDate,
      subscriptionPlatform: platform,
      subscriptionProductId: productId,
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isPremium: true,
        subscriptionId: transactionId,
        subscriptionStatus: "active",
        subscriptionExpiryDate: expiryDate,
        subscriptionPlatform: platform,
        subscriptionProductId: productId,
      },
      { new: true }
    );

    if (!updatedUser) {
      console.error("❌ [Backend] ERROR - User not found during update!");
      throw new ApiError(404, "User not found");
    }

    console.log("✅ [Backend] User updated successfully!");
    console.log("✅ [Backend] User premium status:", updatedUser.isPremium);

    const responseData = {
      success: true,
      message: "Purchase verified successfully",
      data: {
        subscriptionId: subscription._id,
        expiryDate: subscription.expiryDate,
        status: subscription.status,
      },
    };
    console.log("✅ [Backend] Preparing successful response...");
    console.log(
      "✅ [Backend] Response data:",
      JSON.stringify(responseData, null, 2)
    );
    console.log("========================================\n");

    res.status(200).json(responseData);
  } catch (dbError) {
    console.error("❌ [Backend] DATABASE ERROR during subscription creation!");
    console.error("❌ [Backend] Error details:", {
      name: dbError.name,
      message: dbError.message,
      code: dbError.code,
      stack: dbError.stack,
    });
    console.log("========================================\n");
    throw dbError;
  }
});

/**
 * Get current subscription status
 */
export const getSubscriptionStatus = asyncHandler(async (req, res) => {
  console.log("🔵 [Backend] getSubscriptionStatus called");
  const userId = req.user?._id;
  console.log("🔵 [Backend] User ID:", userId);

  if (!userId) {
    console.error("❌ [Backend] User not authenticated");
    throw new ApiError(401, "User not authenticated");
  }

  console.log("🔵 [Backend] Fetching user data...");
  const user = await User.findById(userId).select(
    "isPremium subscriptionStatus subscriptionExpiryDate subscriptionPlatform subscriptionProductId"
  );

  if (!user) {
    console.error("❌ [Backend] User not found");
    throw new ApiError(404, "User not found");
  }

  console.log("🔵 [Backend] User data:", {
    isPremium: user.isPremium,
    status: user.subscriptionStatus,
    expiryDate: user.subscriptionExpiryDate,
  });

  // Check if subscription has expired
  if (user.isPremium && user.subscriptionExpiryDate) {
    const now = new Date();
    console.log(
      "🔵 [Backend] Checking expiry - Now:",
      now,
      "Expiry:",
      user.subscriptionExpiryDate
    );
    if (now > user.subscriptionExpiryDate) {
      console.log("⚠️ [Backend] Subscription expired, updating status");
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
    console.log("✅ [Backend] Subscription still active");
  }

  const responseData = {
    success: true,
    data: {
      isPremium: user.isPremium,
      status: user.subscriptionStatus,
      expiryDate: user.subscriptionExpiryDate,
      platform: user.subscriptionPlatform,
      productId: user.subscriptionProductId,
    },
  };
  console.log(
    "✅ [Backend] Sending status response:",
    JSON.stringify(responseData, null, 2)
  );

  res.status(200).json(responseData);
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
