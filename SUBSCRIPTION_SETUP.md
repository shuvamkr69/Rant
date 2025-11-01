# Rant+ Premium Subscription System

## Overview

This is a complete implementation of a subscription system using **react-native-iap** with **Google Play Billing v8** for the Rant app. The system supports monthly subscriptions with automatic pricing based on user's country/currency.

## Features

- ✅ Monthly subscription (₹99 in India, equivalent in other currencies)
- ✅ Google Play Billing integration
- ✅ Automatic price localization based on user's country
- ✅ Purchase verification with backend
- ✅ Restore purchases functionality
- ✅ Subscription status tracking
- ✅ Premium badge and features
- ✅ Auto-renewal management

## Setup Instructions

### 1. Google Play Console Setup

#### Create Subscription Product:

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Navigate to **Monetize > Subscriptions**
4. Click **Create subscription**
5. Fill in the details:
   - **Product ID**: `rant_premium_monthly`
   - **Name**: Rant+ Premium Monthly
   - **Description**: Premium features including unlimited rants, priority matching, and ad-free experience

#### Set Base Plan:

1. Create a base plan with monthly billing
2. Set base price: **₹99 (INR)**
3. Google Play will automatically convert to other currencies
4. Enable auto-renewal
5. Set trial period (optional): 7 days free trial

#### Configure Pricing:

- Google automatically handles currency conversion
- You can customize pricing for specific countries if needed
- Prices update based on exchange rates

### 2. Backend Setup

The backend files have been created:

```
backend/src/
├── models/
│   ├── user.model.js (updated with premium fields)
│   └── subscription.model.js (new)
├── controllers/
│   └── subscription.controller.js (new)
└── routes/
    ├── subscription.routes.js (new)
    └── main.routes.js (updated)
```

#### Database Schema:

**User Model Updates:**

- `isPremium`: Boolean - Premium status
- `subscriptionId`: String - Transaction ID from store
- `subscriptionStatus`: Enum - active, expired, cancelled, pending, null
- `subscriptionExpiryDate`: Date - Expiry timestamp
- `subscriptionPlatform`: Enum - android, ios, null
- `subscriptionProductId`: String - Product ID

**Subscription Model:**

- Tracks all purchase transactions
- Stores receipt data for verification
- Maintains purchase history

### 3. Frontend Setup

#### Files Created/Updated:

```
components/
├── utils/
│   └── iap.ts (new - IAP utility functions)
└── contexts/
    └── authContext.tsx (updated with premium status)

app/(tabs)/
└── Premium.tsx (updated with full IAP integration)
```

#### Dependencies:

```json
{
  "react-native-iap": "12.15.4" // Compatible with RN 0.81.4
}
```

**Note:** We're using react-native-iap v12.15.4 because:

- It's compatible with React Native 0.81.4 without requiring the new architecture
- Versions 13+ require the new architecture (Turbo Modules)
- Version 12.x is stable and supports Google Play Billing v5+

### 4. Configuration

#### Update Environment Variables:

Add to your `.env` file:

```env
# For backend
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=path/to/service-account.json
```

#### Android Configuration:

**1. Update `android/app/build.gradle`:**

```gradle
dependencies {
    // ... existing dependencies
    implementation 'com.android.billingclient:billing:6.0.1'
}
```

**2. Update `AndroidManifest.xml`:**

```xml
<manifest>
    <uses-permission android:name="com.android.vending.BILLING" />
    <!-- ... rest of manifest -->
</manifest>
```

**3. Add ProGuard rules** (if using ProGuard):

```proguard
-keep class com.android.vending.billing.**
```

### 5. Testing

#### Test in Development:

1. **Add Test Users in Google Play Console:**

   - Go to Settings > License testing
   - Add test email addresses
   - Test users can make purchases without being charged

2. **Use Test Product IDs:**

   - For testing, use: `android.test.purchased`
   - Real product ID for production: `rant_premium_monthly`

3. **Test Purchase Flow:**

```typescript
// In Premium.tsx, the purchase flow is already implemented
// Just tap "Subscribe Now" button
```

4. **Test Restore Purchases:**

```typescript
// Tap "Restore Purchases" button
// This will fetch previous purchases and restore premium status
```

## API Endpoints

### POST `/api/v1/users/subscription/verify`

Verify a purchase with backend after user completes payment.

**Request:**

```json
{
  "transactionId": "GPA.1234...",
  "productId": "rant_premium_monthly",
  "purchaseToken": "token...",
  "platform": "android",
  "purchaseDate": "2025-11-01T00:00:00Z",
  "receiptData": "receipt..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Purchase verified successfully",
  "data": {
    "subscriptionId": "507f1f77bcf86cd799439011",
    "expiryDate": "2025-12-01T00:00:00Z",
    "status": "active"
  }
}
```

### GET `/api/v1/users/subscription/status`

Get current subscription status for logged-in user.

**Response:**

```json
{
  "success": true,
  "data": {
    "isPremium": true,
    "status": "active",
    "expiryDate": "2025-12-01T00:00:00Z",
    "platform": "android",
    "productId": "rant_premium_monthly"
  }
}
```

### POST `/api/v1/users/subscription/restore`

Restore previous purchases.

**Request:**

```json
{
  "platform": "android",
  "receiptData": "receipt..."
}
```

### POST `/api/v1/users/subscription/cancel`

Cancel auto-renewal (user keeps premium until expiry).

**Response:**

```json
{
  "success": true,
  "message": "Subscription cancelled. Premium access will continue until expiry date.",
  "data": {
    "status": "cancelled",
    "expiryDate": "2025-12-01T00:00:00Z"
  }
}
```

### GET `/api/v1/users/subscription/history`

Get user's subscription history.

## Usage in App

### Check Premium Status:

```typescript
import { useAuth } from "@/components/contexts/authContext";

const { isPremium } = useAuth();

if (isPremium) {
  // Show premium features
}
```

### Update Premium Status After Purchase:

```typescript
import { useAuth } from "@/components/contexts/authContext";

const { updatePremiumStatus } = useAuth();

// After successful purchase verification
await updatePremiumStatus(true);
```

## Production Checklist

Before going live:

- [ ] Create subscription product in Google Play Console
- [ ] Set correct pricing (₹99 base price)
- [ ] Configure auto-renewal settings
- [ ] Set up service account for backend verification
- [ ] Test with test users
- [ ] Test restore purchases flow
- [ ] Implement server-side receipt verification (Google Play Developer API)
- [ ] Set up cron job to check expired subscriptions
- [ ] Add cancellation/refund handling
- [ ] Add subscription management UI
- [ ] Test in different countries/currencies
- [ ] Add analytics for subscription events
- [ ] Configure tax settings in Play Console

## Server-Side Verification (Production)

For production, you should verify purchases server-side using Google Play Developer API:

```javascript
// In subscription.controller.js, add actual verification:
import { google } from "googleapis";

async function verifyGooglePlayPurchase(packageName, productId, token) {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  const androidpublisher = google.androidpublisher({
    version: "v3",
    auth,
  });

  const result = await androidpublisher.purchases.subscriptions.get({
    packageName,
    subscriptionId: productId,
    token,
  });

  return result.data;
}
```

## Troubleshooting

### "Product not found" error:

- Ensure product ID matches exactly in Play Console
- Product must be published (not draft)
- App must be in internal/closed/open testing track

### Purchase not completing:

- Check internet connection
- Verify Google Play Services is updated
- Clear Google Play Store cache
- Check test account is added in Play Console

### Restore not working:

- User must be signed in to same Google account
- Purchase must be active/not refunded
- Check backend logs for verification errors

## Currency Support

The subscription automatically supports multiple currencies:

- **India**: ₹99
- **USA**: ~$1.19
- **Europe**: ~€1.09
- **UK**: ~£0.99
- And more...

Google Play handles currency conversion automatically based on base price (₹99 INR).

## Support

For issues:

1. Check backend logs
2. Check React Native logs: `npx react-native log-android`
3. Verify Google Play Console setup
4. Test with test account first

## License

This subscription system is part of the Rant app.
