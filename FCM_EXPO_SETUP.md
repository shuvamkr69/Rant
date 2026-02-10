# FCM Setup for Expo Push Notifications

## Issue

You've added `google-services.json` but push notifications still don't work because Expo needs FCM credentials.

## Steps to Fix

### 1. Get FCM Server Key from Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **rant-2d673**
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to **Cloud Messaging** tab
5. Under **Cloud Messaging API (Legacy)**:
   - If disabled, click **Enable**
   - Copy the **Server key** (starts with `AAAA...`)

### 2. Add FCM Server Key to Expo

1. Go to [Expo Dashboard](https://expo.dev/)
2. Log in to your account
3. Select your project: **rant**
4. Go to **Credentials** section
5. Under **Android**, find **FCM Server Key**
6. Paste your Firebase Server Key
7. Click **Save**

### 3. Alternative: Use EAS Build (Recommended)

If you're building with EAS:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android --profile development
```

### 4. Verify Setup

After adding FCM credentials, rebuild your app:

```bash
npm run android
```

Check logs for:

```
✅ Push token obtained: ExponentPushToken[xxxxx]
✅ Push token sent to backend successfully
```

## Common Issues

### "Firebase not configured" error

- Make sure `google-services.json` is in `android/app/`
- Rebuild the app after adding the file

### "getExpoPushTokenAsync failed"

- Add FCM Server Key to Expo Dashboard
- Make sure Cloud Messaging API is enabled in Firebase

### Token is null

- Check if running on physical device (not emulator)
- Check notification permissions are granted
- Verify Expo project ID in `app.json`

## Test Push Notifications

Once setup is complete, you can test with:

```bash
# Send a test notification
curl -H "Content-Type: application/json" -X POST \
  -d '{
    "to": "ExponentPushToken[xxxxx]",
    "title": "Test",
    "body": "This is a test notification"
  }' \
  https://exp.host/--/api/v2/push/send
```

Replace `ExponentPushToken[xxxxx]` with your actual token from the logs.
