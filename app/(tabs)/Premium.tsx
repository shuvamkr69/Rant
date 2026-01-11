import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { PremiumSkeleton } from "@/components/skeletons";
import {
  endIAP,
  finishTransaction,
  getSubscriptions,
  getSubscriptionStatus,
  handlePendingPurchases,
  initIAP,
  purchaseSubscription,
  restorePurchases as restorePurchasesUtil,
  setupPurchaseUpdateListener,
  SubscriptionProduct,
  verifyPurchaseWithBackend,
} from "@/components/utils/iap";
import { Colors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Premium = () => {
  const { colorScheme } = useTheme();
  const colors = Colors;
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [iapAvailable, setIapAvailable] = useState(true);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  useEffect(() => {
    let removeListener: (() => void) | undefined;

    const initialize = async () => {
      console.log("🔵 [Premium] Starting initialization...");
      try {
        // DEBUG: Check auth status
        const token = await AsyncStorage.getItem("accessToken");
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
        console.log("🔵 [Premium] Auth token exists:", !!token);
        console.log("🔵 [Premium] Backend URL:", backendUrl);

        if (!token) {
          Alert.alert(
            "⚠️ DEBUG: Not Logged In",
            "No auth token found. Please log in first before purchasing."
          );
        }

        // Initialize IAP connection
        console.log("🔵 [Premium] Initializing IAP connection...");
        const connected = await initIAP();
        console.log("🔵 [Premium] IAP initialization result:", connected);

        if (!connected) {
          console.warn(
            "⚠️ [Premium] IAP not available - possibly running on emulator or Google Play not configured"
          );
          setIapAvailable(false);
          setIsLoading(false);
          return;
        }

        console.log("✅ [Premium] IAP connected successfully");

        // Setup purchase listeners
        console.log("🔵 [Premium] Setting up purchase listeners...");
        removeListener = setupPurchaseUpdateListener(
          async (purchase) => {
            console.log(
              "✅ [Premium] Purchase update received in component:",
              JSON.stringify(purchase, null, 2)
            );

            // DEBUG: Show purchase received
            Alert.alert(
              "DEBUG: Step 1",
              "Purchase received from Play Store\n\nProcessing..."
            );

            try {
              // Verify purchase with backend
              const purchaseData = Array.isArray(purchase)
                ? purchase[0]
                : purchase;

              console.log(
                "🔵 [Premium] Processing purchase data:",
                JSON.stringify(purchaseData, null, 2)
              );

              const purchaseResult = {
                transactionId: purchaseData.transactionId || "",
                productId: purchaseData.productId,
                purchaseToken: purchaseData.purchaseToken || "",
                purchaseTime: purchaseData.transactionDate || Date.now(),
              };

              // DEBUG: Show verification starting
              Alert.alert(
                "DEBUG: Step 2",
                `Verifying with backend...\n\nProduct: ${
                  purchaseResult.productId
                }\nTransaction: ${purchaseResult.transactionId.substring(
                  0,
                  20
                )}...`
              );

              console.log("🔵 [Premium] Verifying purchase with backend...");
              const verified = await verifyPurchaseWithBackend(purchaseResult);
              console.log("🔵 [Premium] Verification result:", verified);

              if (verified) {
                console.log("✅ [Premium] Purchase verified successfully!");
                // DEBUG: Show success
                Alert.alert(
                  "✅ DEBUG: Step 3 - SUCCESS",
                  "Backend verified the purchase!\n\nYour premium subscription is now active!"
                );
                await finishTransaction(purchaseData);
                await checkSubscriptionStatus();
              } else {
                console.error("❌ [Premium] Purchase verification failed");
                // DEBUG: Show verification failed
                Alert.alert(
                  "❌ DEBUG: Step 3 - FAILED",
                  "Backend returned verification=false\n\nYour purchase was made but verification failed. Your subscription will be restored on next app restart."
                );
              }
            } catch (error) {
              console.error("❌ [Premium] Error processing purchase:", error);
              const errorMsg =
                (error as any).response?.data?.message ||
                (error as any).message ||
                "Unknown error";
              const statusCode = (error as any).response?.status;

              console.error("❌ [Premium] Error details:", {
                message: errorMsg,
                statusCode: statusCode,
                fullError: error,
              });

              // DEBUG: Show detailed error
              Alert.alert(
                "❌ DEBUG: Step 3 - ERROR",
                `Backend verification threw error:\n\nStatus: ${
                  statusCode || "No status"
                }\nMessage: ${errorMsg}\n\nIf you were charged, your subscription will be restored on next app restart or use "Restore Purchase".`
              );
            } finally {
              setIsPurchasing(false);
            }
          },
          (error) => {
            console.error("❌ [Premium] Purchase error received:", {
              message: error.message,
              code: (error as any).code,
              fullError: error,
            });
            setIsPurchasing(false);

            if ((error as any).code !== "E_USER_CANCELLED") {
              Alert.alert(
                "Purchase Error",
                error.message || "Failed to complete purchase"
              );
            } else {
              console.log("ℹ️ [Premium] User cancelled purchase");
            }
          }
        );
        console.log("✅ [Premium] Purchase listeners set up");

        // Handle any pending purchases
        console.log("🔵 [Premium] Handling pending purchases...");
        await handlePendingPurchases();
        console.log("✅ [Premium] Pending purchases handled");

        // Check subscription status
        console.log("🔵 [Premium] Checking subscription status...");
        await checkSubscriptionStatus();
        console.log("✅ [Premium] Subscription status checked");

        // Load products
        console.log("🔵 [Premium] Loading products...");
        await loadProducts();
        console.log("✅ [Premium] Products loaded");
      } catch (error) {
        console.error("❌ [Premium] Error initializing:", error);
        Alert.alert("Error", "Failed to initialize payment system");
      } finally {
        console.log(
          "🔵 [Premium] Initialization complete, setting loading to false"
        );
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      console.log("🔵 [Premium] Cleanup - removing listeners and ending IAP");
      if (removeListener) {
        removeListener();
      }
      endIAP();
    };
  }, []);

  const loadProducts = async () => {
    console.log("🔵 [Premium] loadProducts called");
    try {
      const availableProducts = await getSubscriptions();
      console.log(
        "✅ [Premium] Products loaded:",
        JSON.stringify(availableProducts, null, 2)
      );
      setProducts(availableProducts);
    } catch (error) {
      console.error("❌ [Premium] Error loading products:", error);
    }
  };

  const checkSubscriptionStatus = async () => {
    console.log("🔵 [Premium] checkSubscriptionStatus called");
    try {
      const status = await getSubscriptionStatus();
      console.log(
        "✅ [Premium] Subscription status:",
        JSON.stringify(status, null, 2)
      );
      setIsPremium(status.isPremium);
      setSubscriptionInfo(status);
    } catch (error) {
      console.error("❌ [Premium] Error checking subscription status:", error);
    }
  };

  const handlePurchase = async () => {
    console.log("🔵 [Premium] handlePurchase called");
    console.log("🔵 [Premium] isPurchasing:", isPurchasing);
    console.log("🔵 [Premium] products:", JSON.stringify(products, null, 2));

    if (isPurchasing) {
      console.warn("⚠️ [Premium] Purchase already in progress, ignoring");
      return;
    }

    setIsPurchasing(true);

    try {
      const productId = products[0]?.productId || "rant_premium_monthly";
      console.log("🔵 [Premium] Product ID to purchase:", productId);
      console.log(
        "🔵 [Premium] Product price:",
        products[0]?.localizedPrice || "₹99"
      );

      Alert.alert(
        "Confirm Purchase",
        `Subscribe to Rant+ Premium for ${
          products[0]?.localizedPrice || "₹99"
        }/month?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              console.log("ℹ️ [Premium] User cancelled purchase confirmation");
              setIsPurchasing(false);
            },
          },
          {
            text: "Subscribe",
            onPress: async () => {
              console.log(
                "🔵 [Premium] User confirmed purchase, initiating..."
              );
              try {
                console.log("🔵 [Premium] Calling purchaseSubscription...");
                const purchase = await purchaseSubscription(productId);
                console.log(
                  "🔵 [Premium] purchaseSubscription returned:",
                  JSON.stringify(purchase, null, 2)
                );

                if (!purchase) {
                  console.warn(
                    "⚠️ [Premium] Purchase returned null (likely user cancelled)"
                  );
                  setIsPurchasing(false);
                  return;
                }

                console.log(
                  "✅ [Premium] Purchase initiated successfully, waiting for listener callback"
                );
                // Purchase listener will handle verification
              } catch (error) {
                console.error("❌ [Premium] Purchase error:", {
                  message: (error as any).message,
                  code: (error as any).code,
                  fullError: error,
                });
                setIsPurchasing(false);
                Alert.alert(
                  "Error",
                  `Failed to initiate purchase: ${
                    (error as any).message || "Unknown error"
                  }`
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("❌ [Premium] Error in handlePurchase:", error);
      setIsPurchasing(false);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleRestore = async () => {
    console.log("🔵 [Premium] handleRestore called");
    console.log("🔵 [Premium] isRestoring:", isRestoring);

    if (isRestoring) {
      console.warn("⚠️ [Premium] Restore already in progress, ignoring");
      return;
    }

    setIsRestoring(true);

    try {
      console.log("🔵 [Premium] Calling restorePurchasesUtil...");
      const restored = await restorePurchasesUtil();
      console.log("🔵 [Premium] Restore result:", restored);

      if (restored) {
        await checkSubscriptionStatus();
        Alert.alert("Success", "Purchases restored successfully!");
      } else {
        Alert.alert("No Purchases", "No previous purchases found to restore.");
      }
    } catch (error) {
      console.error("❌ [Premium] Restore error:", error);
      Alert.alert("Error", "Failed to restore purchases");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      {isLoading ? (
        <PremiumSkeleton />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Header Section with Rant+ Logo */}
          <View style={styles.headerSection}>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>✓ Premium Active</Text>
              </View>
            )}
            <Text style={styles.tagline}>Unlock Premium Experience</Text>
            <Text style={styles.subtitle}>
              Get unlimited access to exclusive features
            </Text>
          </View>

          {/* Premium Plan Card */}
          <View style={styles.plansSection}>
            <View style={[styles.planCard, { width: screenWidth * 0.9 }]}>
              <Text style={styles.planName}>Rant+</Text>
              <Text style={styles.planDuration}>Premium Membership</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.currency}>
                  {products[0]?.currency === "INR" ? "₹" : "$"}
                </Text>
                <Text style={styles.price}>{products[0]?.price || "99"}</Text>
                <Text style={styles.priceSubtext}>/month</Text>
              </View>

              <View style={styles.featuresContainer}>
                {[
                  "Unlimited Rants",
                  "Priority Listener Matching",
                  "Ad-Free Experience",
                  "Custom Profile Badge",
                  "Advanced Analytics",
                  "Exclusive Themes",
                  "24/7 Premium Support",
                ].map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {!isPremium ? (
                <>
                  {!iapAvailable && (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>
                        ⚠️ In-App Purchases not available
                      </Text>
                      <Text style={styles.warningSubtext}>
                        Please use a real device with Google Play Store to make
                        purchases. IAP is not supported on emulators.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      (isPurchasing || !iapAvailable) && styles.disabledButton,
                    ]}
                    activeOpacity={0.8}
                    onPress={handlePurchase}
                    disabled={isPurchasing || !iapAvailable}
                  >
                    <LinearGradient
                      colors={
                        isPurchasing || !iapAvailable
                          ? ["#6b6b6b", "#4a4a4a"]
                          : ["#b794f6", "#6b1fa8"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {isPurchasing ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.subscribeButtonText}>
                          Subscribe Now
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestore}
                    disabled={isRestoring || !iapAvailable}
                  >
                    {isRestoring ? (
                      <ActivityIndicator color="#b794f6" size="small" />
                    ) : (
                      <Text
                        style={[
                          styles.restoreButtonText,
                          !iapAvailable && styles.disabledText,
                        ]}
                      >
                        Restore Purchases
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.activeSubscriptionInfo}>
                  <Text style={styles.activeText}>✓ Subscription Active</Text>
                  {subscriptionInfo?.expiryDate && (
                    <Text style={styles.expiryText}>
                      Expires:{" "}
                      {new Date(
                        subscriptionInfo.expiryDate
                      ).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              )}

              <Text style={styles.termsText}>
                Subscription auto-renews monthly. Cancel anytime from your
                Google Play Store account settings.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  headerSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  premiumBadge: {
    backgroundColor: "#6b1fa8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  premiumBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6b1fa8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 24,
    fontWeight: "700",
    color: "#b794f6",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9BA1A6",
    textAlign: "center",
  },
  plansSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  planCard: {
    backgroundColor: "#1a1226",
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: "#b794f6",
    shadowColor: "#b794f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  planName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ECEDEE",
    marginBottom: 4,
    textAlign: "center",
  },
  planDuration: {
    fontSize: 16,
    color: "#9BA1A6",
    marginBottom: 20,
    textAlign: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    justifyContent: "center",
  },
  currency: {
    fontSize: 24,
    fontWeight: "600",
    color: "#b794f6",
    marginTop: 4,
  },
  price: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#b794f6",
  },
  priceSubtext: {
    fontSize: 16,
    color: "#9BA1A6",
    marginTop: 20,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 24,
    gap: 12,
    alignItems: "center",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    maxWidth: "80%",
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6b1fa8",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  featureText: {
    fontSize: 14,
    color: "#ECEDEE",
    flex: 1,
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  restoreButtonText: {
    fontSize: 14,
    color: "#b794f6",
    fontWeight: "600",
  },
  disabledText: {
    color: "#6b6b6b",
  },
  warningBox: {
    backgroundColor: "#3d2a1f",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f6b794",
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f6b794",
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 12,
    color: "#d9a779",
    lineHeight: 18,
  },
  activeSubscriptionInfo: {
    backgroundColor: "#2a1f3d",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  activeText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6FCF97",
    marginBottom: 4,
  },
  expiryText: {
    fontSize: 14,
    color: "#9BA1A6",
  },
  termsText: {
    fontSize: 11,
    color: "#6b6b6b",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
  },
});

export default Premium;
