# Push Notifications Fix Guide

## The Problem

Push notifications are returning `null` because the app has a partial Firebase configuration:

- `google-services.json` is referenced in `app.json`
- But Firebase isn't fully initialized in the app
- This causes Expo to try using FCM, which fails

## Solution: Use Pure Expo Push Notifications (QUICK FIX)

I've already removed the `googleServicesFile` reference from `app.json`. Now you need to rebuild:

### For Development

```powershell
# Clear cache and rebuild
npx expo start --clear

# Or if using development build
npx expo run:android --device
```

### For Production/EAS Build

```powershell
# Build a new version
eas build --platform android --profile preview
```

## Verify It Works

After rebuilding, login again and check the console for:

```
✅ Push token obtained: ExponentPushToken[xxxxxx]
✅ [Push Token] Successfully sent to backend
```

## Alternative: Complete Firebase Setup (If You Want FCM)

If you prefer to use Firebase Cloud Messaging instead:

1. **Follow FCM_EXPO_SETUP.md** to add FCM credentials
2. **Restore the line in app.json:**
   ```json
   "googleServicesFile": "./android/app/google-services.json",
   ```
3. **Initialize Firebase in your app** (add Firebase SDK)
4. **Rebuild the app**

## What Changed

### app.json

**Removed:**

```json
"googleServicesFile": "./android/app/google-services.json",
```

This tells Expo to use pure Expo Push Notifications instead of FCM.

## Why This Happened

You have `google-services.json` file configured, which signals to Expo that you want to use Firebase Cloud Messaging. However:

- FCM requires additional setup (server key in Expo dashboard)
- FCM requires Firebase to be initialized in your app
- Without these, `getExpoPushTokenAsync()` fails

By removing the reference, Expo will use its native push notification system, which works out of the box!

## Testing

1. Rebuild the app (important!)
2. Login
3. Check console logs for push token registration
4. Verify in backend that `pushToken` field is populated:
   ```javascript
   // Backend response should show:
   "pushToken": "ExponentPushToken[xxxxxxxxxxxxxx]"
   ```

## Backend Compatibility

Your backend is already set up correctly:

- ✅ `updatePushToken` endpoint exists
- ✅ Accepts `pushToken` in request body
- ✅ Stores in User model
- ✅ Returns success response

No backend changes needed!

## Important Notes

- **Must rebuild the app** - Changes to `app.json` require a rebuild
- **Expo Go won't work** - Push notifications require a development/production build
- **Physical device needed** - Push notifications don't work on emulators properly
- **After first successful login** - Token will be sent to backend automatically
- **On app restart** - Token is re-registered when user is already logged in

## Troubleshooting

### Still getting null token after rebuild?

Check console for:

```
❌ Error type: [error type]
❌ Error message: [detailed message]
```

Share the full error output for further diagnosis.

### Token obtained but not sent to backend?

Check for:

```
🔑 [Push Token] Access token available: true
```

If false, there's a timing issue with token storage.

### Backend returns error?

Check backend logs for the `/api/v1/users/update-push-token` endpoint.
