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
  console.log('🔵 [IAP] Starting IAP initialization...');
  try {
    console.log('🔵 [IAP] Calling RNIap.initConnection()...');
    const result = await RNIap.initConnection();
    console.log('✅ [IAP] Connection initialized successfully:', result);
    return true;
  } catch (error: any) {
    console.error('❌ [IAP] Error during initialization:', {
      message: error.message,
      code: error.code,
      fullError: error,
    });
    // E_IAP_NOT_AVAILABLE means Google Play Billing is not available
    // This happens on emulators or devices without Google Play Services
    if (error.code === 'E_IAP_NOT_AVAILABLE') {
      console.warn('⚠️ [IAP] Google Play Billing not available. This is expected on emulators or devices without Google Play Services.');
      console.warn('💡 [IAP] To test IAP, use a real device with Google Play Store installed.');
      return false;
    }
    console.error('❌ [IAP] Unexpected error initializing IAP connection:', error);
    return false;
  }
};

/**
 * End IAP connection
 */
export const endIAP = async (): Promise<void> => {
  console.log('🔵 [IAP] Ending IAP connection...');
  try {
    await RNIap.endConnection();
    console.log('✅ [IAP] Connection ended successfully');
  } catch (error) {
    console.error('❌ [IAP] Error ending IAP connection:', error);
  }
};

/**
 * Get available subscription products
 */
export const getSubscriptions = async (): Promise<SubscriptionProduct[]> => {
  console.log('🔵 [IAP] Fetching subscription products...');
  console.log('🔵 [IAP] Product SKUs:', SUBSCRIPTION_SKUS);
  try {
    console.log('🔵 [IAP] Calling RNIap.getSubscriptions()...');
    const products = await RNIap.getSubscriptions({ skus: SUBSCRIPTION_SKUS });
    console.log('✅ [IAP] Raw products fetched:', JSON.stringify(products, null, 2));
    
    if (!products || products.length === 0) {
      console.warn('⚠️ [IAP] No products returned from store');
      return [];
    }
    
    const mappedProducts = products.map((product: any) => ({
      productId: product.productId,
      title: product.title || 'Rant+ Premium',
      description: product.description || 'Premium subscription',
      price: product.price || '₹99',
      currency: product.currency || 'INR',
      localizedPrice: product.localizedPrice || '₹99.00',
    }));
    
    console.log('✅ [IAP] Mapped products:', JSON.stringify(mappedProducts, null, 2));
    return mappedProducts;
  } catch (error) {
    console.error('❌ [IAP] Error fetching subscriptions:', {
      message: (error as any).message,
      code: (error as any).code,
      fullError: error,
    });
    throw error;
  }
};

/**
 * Request subscription purchase
 */
export const purchaseSubscription = async (
  productId: string
): Promise<PurchaseResult | null> => {
  console.log('🔵 [IAP] Starting purchase request for productId:', productId);
  console.log('🔵 [IAP] Platform:', Platform.OS);
  try {
    // On Android Google Play Billing requires selected offerTokens for
    // subscription SKUs (subscriptionOffers). Fetch the subscription details
    // first and pass the offers when requesting the purchase.
    let purchase: any = null;

    if (Platform.OS === 'android') {
      console.log('🔵 [IAP] Android platform - fetching product details for offers...');
      try {
        const products = await RNIap.getSubscriptions({ skus: [productId] });
        console.log('🔵 [IAP] Product details fetched:', JSON.stringify(products, null, 2));
        const product = Array.isArray(products) && products.length ? products[0] : null;

        if (!product) {
          console.error('❌ [IAP] No product found for productId:', productId);
          throw new Error(`Product not found: ${productId}`);
        }

        // subscriptionOfferDetails is the field that contains available offers
        // Each offer has an offerToken we must pass to requestSubscription
        const offers: Array<{ sku: string; offerToken: string }> = [];

        console.log('🔵 [IAP] Checking for subscription offers...');
        if (product && ((product as any).subscriptionOfferDetails || (product as any).subscriptionOffers)) {
          // some versions expose subscriptionOfferDetails, others subscriptionOffers
          const details = (product as any).subscriptionOfferDetails || (product as any).subscriptionOffers;
          console.log('🔵 [IAP] Subscription offer details:', JSON.stringify(details, null, 2));
          if (Array.isArray(details)) {
            for (const d of details) {
              const offerToken = d.offerToken || d.offerId || d.id;
              if (offerToken) {
                offers.push({ sku: productId, offerToken });
                console.log('🔵 [IAP] Added offer token:', offerToken);
              }
            }
          }
        } else {
          console.warn('⚠️ [IAP] No subscription offer details found in product');
        }

        console.log('🔵 [IAP] Total offers found:', offers.length);
        if (offers.length === 0) {
          console.warn('⚠️ [IAP] No offers available - attempting purchase without offers');
          // Fallback: call without offers — request will likely throw and we'll
          // surface the error to the caller so it can be addressed.
          console.log('🔵 [IAP] Calling RNIap.requestSubscription() WITHOUT offers...');
          purchase = await RNIap.requestSubscription({ sku: productId });
        } else {
          console.log('🔵 [IAP] Calling RNIap.requestSubscription() WITH offers:', JSON.stringify(offers, null, 2));
          purchase = await RNIap.requestSubscription({ sku: productId, subscriptionOffers: offers });
        }
      } catch (err) {
        console.error('❌ [IAP] Android purchase error:', {
          message: (err as any).message,
          code: (err as any).code,
          fullError: err,
        });
        // Re-throw so caller can handle errors (including missing offers)
        throw err;
      }
    } else {
      // iOS path
      console.log('🔵 [IAP] iOS platform - calling RNIap.requestSubscription()...');
      purchase = await RNIap.requestSubscription({ sku: productId });
    }

    if (!purchase) {
      console.error('❌ [IAP] Purchase returned null/undefined');
      throw new Error('Purchase failed - no purchase data returned');
    }

    console.log('✅ [IAP] Purchase successful - raw data:', JSON.stringify(purchase, null, 2));

    // Handle array response
    const purchaseData = Array.isArray(purchase) ? purchase[0] : purchase;
    console.log('🔵 [IAP] Processing purchase data:', JSON.stringify(purchaseData, null, 2));

    const purchaseResult: PurchaseResult = {
      transactionId: (purchaseData as any).transactionId || '',
      productId: (purchaseData as any).productId,
      purchaseToken: (purchaseData as any).purchaseToken || '',
      purchaseTime: (purchaseData as any).transactionDate || Date.now(),
      transactionReceipt: (purchaseData as any).transactionReceipt,
    };

    console.log('✅ [IAP] Purchase result created:', JSON.stringify(purchaseResult, null, 2));
    return purchaseResult;
  } catch (error: any) {
    if (error.code === 'E_USER_CANCELLED') {
      console.log('ℹ️ [IAP] User cancelled the purchase');
      return null;
    }
    console.error('❌ [IAP] Error purchasing subscription:', {
      message: error.message,
      code: error.code,
      fullError: error,
    });
    throw error;
  }
};

/**
 * Verify purchase with backend
 */
export const verifyPurchaseWithBackend = async (
  purchase: PurchaseResult
): Promise<boolean> => {
  console.log('🔵 [IAP] Verifying purchase with backend...');
  console.log('🔵 [IAP] Purchase data:', JSON.stringify(purchase, null, 2));
  try {
    const requestPayload = {
      transactionId: purchase.transactionId,
      productId: purchase.productId,
      purchaseToken: purchase.purchaseToken,
      platform: Platform.OS,
      purchaseDate: new Date(purchase.purchaseTime),
      receiptData: purchase.transactionReceipt,
    };
    console.log('🔵 [IAP] Sending verification request to backend:', JSON.stringify(requestPayload, null, 2));
    
    const response = await api.post('/subscription/verify', requestPayload);
    
    console.log('✅ [IAP] Backend verification response:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('✅ [IAP] Purchase verified successfully with backend');
      return true;
    }
    console.warn('⚠️ [IAP] Backend verification failed - success: false');
    return false;
  } catch (error) {
    console.error('❌ [IAP] Error verifying purchase with backend:', {
      message: (error as any).message,
      response: (error as any).response?.data,
      status: (error as any).response?.status,
      fullError: error,
    });
    throw error;
  }
};

/**
 * Finish transaction (important for Android)
 */
export const finishTransaction = async (
  purchase: any
): Promise<void> => {
  console.log('🔵 [IAP] Finishing transaction...');
  console.log('🔵 [IAP] Purchase to finish:', JSON.stringify(purchase, null, 2));
  try {
    await RNIap.finishTransaction(purchase);
    console.log('✅ [IAP] Transaction finished successfully');
  } catch (error) {
    console.error('❌ [IAP] Error finishing transaction:', error);
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<boolean> => {
  console.log('🔵 [IAP] Restoring purchases...');
  try {
    const purchases = await RNIap.getAvailablePurchases();
    console.log('🔵 [IAP] Available purchases:', JSON.stringify(purchases, null, 2));

    if (purchases.length === 0) {
      console.log('ℹ️ [IAP] No purchases to restore');
      return false;
    }

    // Get the most recent subscription purchase
    const subscriptionPurchases = purchases.filter((p) =>
      SUBSCRIPTION_SKUS.includes(p.productId)
    );
    console.log('🔵 [IAP] Subscription purchases found:', subscriptionPurchases.length);

    if (subscriptionPurchases.length === 0) {
      console.log('ℹ️ [IAP] No subscription purchases found');
      return false;
    }

    const latestPurchase = subscriptionPurchases.sort(
      (a, b) => (b.transactionDate || 0) - (a.transactionDate || 0)
    )[0];
    console.log('🔵 [IAP] Latest purchase:', JSON.stringify(latestPurchase, null, 2));

    // Restore with backend
    console.log('🔵 [IAP] Sending restore request to backend...');
    const response = await api.post('/subscription/restore', {
      platform: Platform.OS,
      receiptData: (latestPurchase as any).transactionReceipt || latestPurchase.transactionId,
    });
    console.log('✅ [IAP] Backend restore response:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('✅ [IAP] Purchases restored successfully');
      return true;
    }

    console.warn('⚠️ [IAP] Backend restore failed');
    return false;
  } catch (error) {
    console.error('❌ [IAP] Error restoring purchases:', {
      message: (error as any).message,
      response: (error as any).response?.data,
      fullError: error,
    });
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
  console.log('🔵 [IAP] Getting subscription status from backend...');
  try {
    const response = await api.get('/subscription/status');
    console.log('✅ [IAP] Subscription status response:', JSON.stringify(response.data, null, 2));
    
    return {
      isPremium: response.data.data.isPremium || false,
      status: response.data.data.status || null,
      expiryDate: response.data.data.expiryDate
        ? new Date(response.data.data.expiryDate)
        : null,
    };
  } catch (error) {
    console.error('❌ [IAP] Error getting subscription status:', {
      message: (error as any).message,
      response: (error as any).response?.data,
      fullError: error,
    });
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
  console.log('🔵 [IAP] Setting up purchase update listeners...');
  try {
    const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase) => {
        console.log('✅ [IAP] Purchase update received:', JSON.stringify(purchase, null, 2));
        onPurchaseUpdate(purchase);
      }
    );

    const purchaseErrorSubscription = RNIap.purchaseErrorListener((error) => {
      console.error('❌ [IAP] Purchase error received:', {
        message: error.message,
        code: error.code,
        fullError: error,
      });
      onPurchaseError(error);
    });

    console.log('✅ [IAP] Purchase listeners set up successfully');

    return () => {
      console.log('🔵 [IAP] Removing purchase listeners...');
      purchaseUpdateSubscription.remove();
      purchaseErrorSubscription.remove();
    };
  } catch (error: any) {
    console.error('❌ [IAP] Failed to setup purchase listeners:', {
      message: error.message,
      fullError: error,
    });
    // Return empty cleanup function if listener setup fails
    return () => {};
  }
};

/**
 * Handle pending purchases on app start
 */
export const handlePendingPurchases = async (): Promise<void> => {
  console.log('🔵 [IAP] Checking for pending purchases...');
  try {
    const purchases = await RNIap.getAvailablePurchases();
    console.log('🔵 [IAP] Available purchases found:', purchases.length);
    console.log('🔵 [IAP] Purchase details:', JSON.stringify(purchases, null, 2));
    
    for (const purchase of purchases) {
      console.log('🔵 [IAP] Processing purchase:', purchase.productId);
      if (SUBSCRIPTION_SKUS.includes(purchase.productId)) {
        console.log('🔵 [IAP] Found subscription purchase to process');
        // Verify with backend if not already verified
        const purchaseResult: PurchaseResult = {
          transactionId: purchase.transactionId || '',
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken || '',
          purchaseTime: purchase.transactionDate || Date.now(),
          transactionReceipt: (purchase as any).transactionReceipt,
        };

        try {
          console.log('🔵 [IAP] Verifying pending purchase with backend...');
          await verifyPurchaseWithBackend(purchaseResult);
          console.log('✅ [IAP] Pending purchase verified');
          await finishTransaction(purchase);
          console.log('✅ [IAP] Pending purchase transaction finished');
        } catch (error) {
          console.error('❌ [IAP] Error handling pending purchase:', {
            productId: purchase.productId,
            error: error,
          });
        }
      } else {
        console.log('🔵 [IAP] Skipping non-subscription purchase:', purchase.productId);
      }
    }
    console.log('✅ [IAP] Finished processing pending purchases');
  } catch (error) {
    console.error('❌ [IAP] Error handling pending purchases:', {
      message: (error as any).message,
      fullError: error,
    });
  }
};
