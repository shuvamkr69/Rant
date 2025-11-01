import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';
import { api } from './api';

// Product IDs for subscriptions
export const SUBSCRIPTION_SKUS = Platform.select({
  ios: ['rant_premium_monthly'],
  android: ['rant_premium_monthly'],
}) || [];

// Subscription product details
export interface SubscriptionProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice: string;
}

// Purchase result interface
export interface PurchaseResult {
  transactionId: string;
  productId: string;
  purchaseToken: string;
  purchaseTime: number;
  transactionReceipt?: string;
}

/**
 * Initialize IAP connection
 */
export const initIAP = async (): Promise<boolean> => {
  try {
    const result = await RNIap.initConnection();
    console.log('IAP Connection initialized:', result);
    return true;
  } catch (error: any) {
    // E_IAP_NOT_AVAILABLE means Google Play Billing is not available
    // This happens on emulators or devices without Google Play Services
    if (error.code === 'E_IAP_NOT_AVAILABLE') {
      console.warn('⚠️ Google Play Billing not available. This is expected on emulators or devices without Google Play Services.');
      console.warn('💡 To test IAP, use a real device with Google Play Store installed.');
      return false;
    }
    console.error('Error initializing IAP connection:', error);
    return false;
  }
};

/**
 * End IAP connection
 */
export const endIAP = async (): Promise<void> => {
  try {
    await RNIap.endConnection();
    console.log('IAP Connection ended');
  } catch (error) {
    console.error('Error ending IAP connection:', error);
  }
};

/**
 * Get available subscription products
 */
export const getSubscriptions = async (): Promise<SubscriptionProduct[]> => {
  try {
    const products = await RNIap.getSubscriptions({ skus: SUBSCRIPTION_SKUS });
    console.log('Available subscriptions:', products);
    
    if (!products || products.length === 0) {
      return [];
    }
    
    return products.map((product: any) => ({
      productId: product.productId,
      title: product.title || 'Rant+ Premium',
      description: product.description || 'Premium subscription',
      price: product.price || '₹99',
      currency: product.currency || 'INR',
      localizedPrice: product.localizedPrice || '₹99.00',
    }));
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

/**
 * Request subscription purchase
 */
export const purchaseSubscription = async (
  productId: string
): Promise<PurchaseResult | null> => {
  try {
    // On Android Google Play Billing requires selected offerTokens for
    // subscription SKUs (subscriptionOffers). Fetch the subscription details
    // first and pass the offers when requesting the purchase.
    let purchase: any = null;

    if (Platform.OS === 'android') {
      try {
        const products = await RNIap.getSubscriptions({ skus: [productId] });
        const product = Array.isArray(products) && products.length ? products[0] : null;

        // subscriptionOfferDetails is the field that contains available offers
        // Each offer has an offerToken we must pass to requestSubscription
        const offers: Array<{ sku: string; offerToken: string }> = [];

        if (product && ((product as any).subscriptionOfferDetails || (product as any).subscriptionOffers)) {
          // some versions expose subscriptionOfferDetails, others subscriptionOffers
          const details = (product as any).subscriptionOfferDetails || (product as any).subscriptionOffers;
          if (Array.isArray(details)) {
            for (const d of details) {
              const offerToken = d.offerToken || d.offerId || d.id;
              if (offerToken) offers.push({ sku: productId, offerToken });
            }
          }
        }

        if (offers.length === 0) {
          // Fallback: call without offers — request will likely throw and we'll
          // surface the error to the caller so it can be addressed.
          purchase = await RNIap.requestSubscription({ sku: productId });
        } else {
          purchase = await RNIap.requestSubscription({ sku: productId, subscriptionOffers: offers });
        }
      } catch (err) {
        // Re-throw so caller can handle errors (including missing offers)
        throw err;
      }
    } else {
      // iOS path
      purchase = await RNIap.requestSubscription({ sku: productId });
    }

    if (!purchase) {
      throw new Error('Purchase failed');
    }

    // Handle array response
    const purchaseData = Array.isArray(purchase) ? purchase[0] : purchase;

    const purchaseResult: PurchaseResult = {
      transactionId: (purchaseData as any).transactionId || '',
      productId: (purchaseData as any).productId,
      purchaseToken: (purchaseData as any).purchaseToken || '',
      purchaseTime: (purchaseData as any).transactionDate || Date.now(),
      transactionReceipt: (purchaseData as any).transactionReceipt,
    };

    console.log('Purchase successful:', purchaseResult);
    return purchaseResult;
  } catch (error: any) {
    if (error.code === 'E_USER_CANCELLED') {
      console.log('User cancelled the purchase');
      return null;
    }
    console.error('Error purchasing subscription:', error);
    throw error;
  }
};

/**
 * Verify purchase with backend
 */
export const verifyPurchaseWithBackend = async (
  purchase: PurchaseResult
): Promise<boolean> => {
  try {
    const response = await api.post('/subscription/verify', {
      transactionId: purchase.transactionId,
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken,
      platform: Platform.OS,
      purchaseDate: new Date(purchase.purchaseTime),
      receiptData: purchase.transactionReceipt,
    });

    if (response.data.success) {
      console.log('Purchase verified with backend');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error verifying purchase with backend:', error);
    throw error;
  }
};

/**
 * Finish transaction (important for Android)
 */
export const finishTransaction = async (
  purchase: any
): Promise<void> => {
  try {
    await RNIap.finishTransaction(purchase);
    console.log('Transaction finished');
  } catch (error) {
    console.error('Error finishing transaction:', error);
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<boolean> => {
  try {
    const purchases = await RNIap.getAvailablePurchases();
    console.log('Available purchases:', purchases);

    if (purchases.length === 0) {
      console.log('No purchases to restore');
      return false;
    }

    // Get the most recent subscription purchase
    const subscriptionPurchases = purchases.filter((p) =>
      SUBSCRIPTION_SKUS.includes(p.productId)
    );

    if (subscriptionPurchases.length === 0) {
      console.log('No subscription purchases found');
      return false;
    }

    const latestPurchase = subscriptionPurchases.sort(
      (a, b) => (b.transactionDate || 0) - (a.transactionDate || 0)
    )[0];

    // Restore with backend
    const response = await api.post('/subscription/restore', {
      platform: Platform.OS,
      receiptData: (latestPurchase as any).transactionReceipt || latestPurchase.transactionId,
    });

    if (response.data.success) {
      console.log('Purchases restored successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};

/**
 * Get subscription status from backend
 */
export const getSubscriptionStatus = async (): Promise<{
  isPremium: boolean;
  status: string | null;
  expiryDate: Date | null;
}> => {
  try {
    const response = await api.get('/subscription/status');
    
    return {
      isPremium: response.data.data.isPremium || false,
      status: response.data.data.status || null,
      expiryDate: response.data.data.expiryDate
        ? new Date(response.data.data.expiryDate)
        : null,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (): Promise<boolean> => {
  try {
    const response = await api.post('/subscription/cancel');
    return response.data.success;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * Setup purchase update listener
 */
export const setupPurchaseUpdateListener = (
  onPurchaseUpdate: (purchase: any) => void,
  onPurchaseError: (error: any) => void
) => {
  try {
    const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase) => {
        console.log('Purchase update received:', purchase);
        onPurchaseUpdate(purchase);
      }
    );

    const purchaseErrorSubscription = RNIap.purchaseErrorListener((error) => {
      console.warn('Purchase error:', error);
      onPurchaseError(error);
    });

    return () => {
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  } catch (error: any) {
    console.warn('Failed to setup purchase listeners:', error);
    // Return empty cleanup function if listener setup fails
    return () => {};
  }
};

/**
 * Handle pending purchases on app start
 */
export const handlePendingPurchases = async (): Promise<void> => {
  try {
    const purchases = await RNIap.getAvailablePurchases();
    
    for (const purchase of purchases) {
      if (SUBSCRIPTION_SKUS.includes(purchase.productId)) {
        // Verify with backend if not already verified
        const purchaseResult: PurchaseResult = {
          transactionId: purchase.transactionId || '',
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken || '',
          purchaseTime: purchase.transactionDate || Date.now(),
          transactionReceipt: (purchase as any).transactionReceipt,
        };

        try {
          await verifyPurchaseWithBackend(purchaseResult);
          await finishTransaction(purchase);
        } catch (error) {
          console.error('Error handling pending purchase:', error);
        }
      }
    }
  } catch (error) {
    console.error('Error handling pending purchases:', error);
  }
};
