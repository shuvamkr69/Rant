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
      try {
        // Initialize IAP connection
        const connected = await initIAP();
        
        if (!connected) {
          console.warn('IAP not available - possibly running on emulator or Google Play not configured');
          setIapAvailable(false);
          setIsLoading(false);
          return;
        }

        // Setup purchase listeners
        removeListener = setupPurchaseUpdateListener(
          async (purchase) => {
            console.log("Purchase update received:", purchase);

            try {
              // Verify purchase with backend
              const purchaseData = Array.isArray(purchase)
                ? purchase[0]
                : purchase;

              const purchaseResult = {
                transactionId: purchaseData.transactionId || "",
                productId: purchaseData.productId,
                purchaseToken: purchaseData.purchaseToken || "",
                purchaseTime: purchaseData.transactionDate || Date.now(),
              };

              const verified = await verifyPurchaseWithBackend(purchaseResult);

              if (verified) {
                Alert.alert(
                  "Success!",
                  "Your premium subscription is now active!",
                  [{ text: "OK", onPress: () => checkSubscriptionStatus() }]
                );
                await finishTransaction(purchaseData);
              }
            } catch (error) {
              console.error("Error processing purchase:", error);
              Alert.alert(
                "Error",
                "Failed to verify purchase. Please contact support."
              );
            } finally {
              setIsPurchasing(false);
            }
          },
          (error) => {
            console.error("Purchase error:", error);
            setIsPurchasing(false);

            if ((error as any).code !== "E_USER_CANCELLED") {
              Alert.alert(
                "Purchase Error",
                error.message || "Failed to complete purchase"
              );
            }
          }
        );

        // Handle any pending purchases
        await handlePendingPurchases();

        // Check subscription status
        await checkSubscriptionStatus();

        // Load products
        await loadProducts();
      } catch (error) {
        console.error("Error initializing:", error);
        Alert.alert("Error", "Failed to initialize payment system");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      if (removeListener) {
        removeListener();
      }
      endIAP();
    };
  }, []);

  const loadProducts = async () => {
    try {
      const availableProducts = await getSubscriptions();
      setProducts(availableProducts);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      setIsPremium(status.isPremium);
      setSubscriptionInfo(status);
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const handlePurchase = async () => {
    if (isPurchasing) return;

    setIsPurchasing(true);

    try {
      const productId = products[0]?.productId || "rant_premium_monthly";

      Alert.alert(
        "Confirm Purchase",
        `Subscribe to Rant+ Premium for ${
          products[0]?.localizedPrice || "₹99"
        }/month?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setIsPurchasing(false),
          },
          {
            text: "Subscribe",
            onPress: async () => {
              try {
                const purchase = await purchaseSubscription(productId);

                if (!purchase) {
                  setIsPurchasing(false);
                  return;
                }

                // Purchase listener will handle verification
              } catch (error) {
                console.error("Purchase error:", error);
                setIsPurchasing(false);
                Alert.alert("Error", "Failed to initiate purchase");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error:", error);
      setIsPurchasing(false);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;

    setIsRestoring(true);

    try {
      const restored = await restorePurchasesUtil();

      if (restored) {
        await checkSubscriptionStatus();
        Alert.alert("Success", "Purchases restored successfully!");
      } else {
        Alert.alert("No Purchases", "No previous purchases found to restore.");
      }
    } catch (error) {
      console.error("Restore error:", error);
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
                        Please use a real device with Google Play Store to make purchases. 
                        IAP is not supported on emulators.
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
                      <Text style={[styles.restoreButtonText, !iapAvailable && styles.disabledText]}>
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
