# Firebase Cloud Messaging Setup for Push Notifications

## Steps to Configure FCM

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name (e.g., "Rant")
4. Follow the setup wizard

### 2. Add Android App

1. In Firebase Console, click the Android icon
2. Enter package name: `com.flaminco.rant`
3. App nickname: `Rant` (optional)
4. Debug signing certificate SHA-1: (optional for push notifications)
5. Click "Register app"

### 3. Download google-services.json

1. Download the `google-services.json` file
2. Place it in: `android/app/google-services.json`

### 4. Get Server Key for Expo

1. In Firebase Console, go to Project Settings → Cloud Messaging
2. Under "Cloud Messaging API (Legacy)", copy the Server Key
3. Go to https://expo.dev/
4. Select your project
5. Go to Project Settings → Credentials
6. Under "FCM Server Key", paste your Firebase Server Key
7. Save

### 5. Rebuild and Test

```bash
npx expo prebuild --clean
npx expo run:android --variant playDebug
```

## Verify Setup

- Check that `google-services.json` exists at `android/app/google-services.json`
- Check that the package name in `google-services.json` matches `com.flaminco.rant`
- Test push notifications on a physical device

## Troubleshooting

- **"FirebaseApp is not initialized"** → Missing or incorrectly placed `google-services.json`
- **Notifications not received** → Check FCM Server Key in Expo dashboard
- **Build fails** → Run `npx expo prebuild --clean` again
