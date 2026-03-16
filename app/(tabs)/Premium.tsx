import { useAuth } from "@/components/contexts/authContext";
import PremiumTimeline from "@/components/ui/PremiumTimeline";
import {
  finishTransaction,
  getSubscriptions,
  initIAP,
  PurchaseResult,
  purchaseSubscription,
  restorePurchases,
  setupPurchaseUpdateListener,
  SubscriptionProduct,
  verifyPurchaseWithBackend,
} from "@/components/utils/iap";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Premium = () => {
  const { isPremium, updatePremiumStatus } = useAuth();
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    initializeIAP();

    // Setup purchase listeners
    const removeListener = setupPurchaseUpdateListener(
      handlePurchaseUpdate,
      handlePurchaseError,
    );

    return () => {
      removeListener();
    };
  }, []);

  const initializeIAP = async () => {
    try {
      const connected = await initIAP();
      if (connected) {
        await loadProducts();
      } else {
        setLoading(false);
        Alert.alert(
          "IAP Not Available",
          "In-app purchases are not available on this device. Please use a real device with Google Play Store.",
        );
      }
    } catch (error) {
      console.error("Failed to initialize IAP:", error);
      setLoading(false);
      Alert.alert(
        "Error",
        "Failed to load subscription options. Please try again later.",
      );
    }
  };

  const loadProducts = async () => {
    try {
      const availableProducts = await getSubscriptions();
      setProducts(availableProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
      Alert.alert(
        "Error",
        "Failed to load subscription products. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseUpdate = async (purchase: any) => {
    try {
      console.log("Processing purchase update...");

      const purchaseResult: PurchaseResult = {
        transactionId: purchase.transactionId || "",
        productId: purchase.productId,
        purchaseToken: purchase.purchaseToken || "",
        purchaseTime: purchase.transactionDate || Date.now(),
        transactionReceipt: purchase.transactionReceipt,
      };

      // Verify with backend
      const verified = await verifyPurchaseWithBackend(purchaseResult);

      if (verified) {
        // Update premium status
        await updatePremiumStatus(true);

        // Finish transaction
        await finishTransaction(purchase);

        Alert.alert(
          "Success! 🎉",
          "Welcome to Rant+ Premium! Enjoy unlimited features.",
          [{ text: "OK" }],
        );
      } else {
        Alert.alert(
          "Verification Failed",
          "Unable to verify your purchase. Please contact support.",
        );
      }
    } catch (error) {
      console.error("Error processing purchase:", error);
      Alert.alert(
        "Error",
        "Failed to process your purchase. Please contact support.",
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchaseError = (error: any) => {
    console.error("Purchase error:", error);
    setPurchasing(false);

    if (error.code !== "E_USER_CANCELLED") {
      Alert.alert(
        "Purchase Failed",
        error.message || "An error occurred during purchase. Please try again.",
      );
    }
  };

  const handlePurchase = async (productId: string) => {
    if (purchasing) return;

    setPurchasing(true);
    try {
      await purchaseSubscription(productId);
      // Purchase update will be handled by the listener
    } catch (error: any) {
      console.error("Purchase failed:", error);
      setPurchasing(false);

      if (error.code !== "E_USER_CANCELLED") {
        Alert.alert(
          "Purchase Failed",
          error.message || "An error occurred. Please try again.",
        );
      }
    }
  };

  const handleRestore = async () => {
    if (restoring) return;

    setRestoring(true);
    try {
      const restored = await restorePurchases();

      if (restored) {
        await updatePremiumStatus(true);
        Alert.alert(
          "Restored! 🎉",
          "Your premium subscription has been restored successfully.",
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases to restore.",
        );
      }
    } catch (error) {
      console.error("Restore failed:", error);
      Alert.alert(
        "Restore Failed",
        "Failed to restore purchases. Please try again.",
      );
    } finally {
      setRestoring(false);
    }
  };

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Badge */}
          <LinearGradient
            colors={["#a855f7", "#ec4899", "#f97316"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumBadge}
          >
            <Ionicons name="star" size={40} color="#fff" />
            <Text style={styles.premiumBadgeText}>You're Premium! 🎉</Text>
            <Text style={styles.premiumBadgeSubtext}>
              Enjoying all the exclusive features
            </Text>
          </LinearGradient>

          {/* Premium Features Timeline */}
          <PremiumTimeline />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Features Timeline */}
        <PremiumTimeline />

        {/* Subscription Plans */}
        <View style={styles.plansContainer}>
          <View style={styles.plansHeader}>
            <Ionicons name="diamond-outline" size={32} color="#a855f7" />
            <Text style={styles.plansTitle}>Upgrade to Premium</Text>
            <Text style={styles.plansSubtitle}>
              Choose the plan that works best for you
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#a855f7" />
              <Text style={styles.loadingText}>Loading plans...</Text>
            </View>
          ) : products.length > 0 ? (
            products.map((product) => (
              <View key={product.productId} style={styles.planCard}>
                <View style={styles.planContent}>
                  <View style={styles.planTop}>
                    <View style={styles.planIconBadge}>
                      <Ionicons name="diamond" size={20} color="#a855f7" />
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{product.title}</Text>
                      <Text style={styles.planDescription}>
                        {product.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planDivider} />

                  <View style={styles.planPricingSection}>
                    <View style={styles.planPricing}>
                      <Text style={styles.planPrice}>
                        {product.localizedPrice}
                      </Text>
                      <Text style={styles.planPeriod}>per month</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.purchaseButton,
                        purchasing && styles.purchaseButtonDisabled,
                      ]}
                      onPress={() => handlePurchase(product.productId)}
                      disabled={purchasing}
                      activeOpacity={0.7}
                    >
                      {purchasing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.purchaseButtonText}>
                            Subscribe Now
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="#fff"
                          />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noPlansContainer}>
              <Ionicons name="alert-circle" size={48} color="#666" />
              <Text style={styles.noPlansText}>
                No subscription plans available at this time.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadProducts}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Restore Purchases Button */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={restoring}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#a855f7" />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color="#a855f7" />
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Terms and Privacy */}
          <View style={styles.legalContainer}>
            <Text style={styles.legalText}>
              By subscribing, you agree to our Terms of Service and Privacy
              Policy. Subscription will auto-renew unless cancelled.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  plansContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  plansHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  plansTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  plansSubtitle: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },
  premiumBadge: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  premiumBadgeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
    marginBottom: 8,
  },
  premiumBadgeSubtext: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    marginTop: 16,
    fontSize: 16,
  },
  planCard: {
    marginBottom: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    overflow: "hidden",
  },
  planContent: {
    padding: 24,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  planIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
    color: "#999",
    lineHeight: 18,
  },
  planDivider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginBottom: 20,
  },
  planPricingSection: {
    gap: 20,
  },
  planPricing: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  planPeriod: {
    fontSize: 14,
    color: "#666",
  },
  purchaseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#a855f7",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 20,
    gap: 8,
  },
  restoreButtonText: {
    fontSize: 16,
    color: "#a855f7",
    fontWeight: "600",
  },
  noPlansContainer: {
    padding: 40,
    alignItems: "center",
  },
  noPlansText: {
    color: "#666",
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#a855f7",
    fontSize: 16,
    fontWeight: "600",
  },
  legalContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  legalText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
});

export default Premium;
