# Push Notifications Integration - Summary

## Files Modified/Created

### Frontend

#### 1. **components/utils/notifications.ts** (NEW)

- Notification handler configuration
- `registerForPushNotificationsAsync()` - Gets Expo push token
- `sendPushTokenToBackend()` - Sends token to backend
- `removePushTokenFromBackend()` - Removes token on logout
- `setupNotificationListeners()` - Foreground notification listeners

#### 2. **components/contexts/authContext.tsx** (MODIFIED)

- Added imports: `registerForPushNotificationsAsync`, `sendPushTokenToBackend`, `removePushTokenFromBackend`, `setupNotificationListeners`
- `useEffect`: Register push token when app opens and user is signed in
- `useEffect`: Setup notification listeners with cleanup
- `signOut`: Remove push token from backend before logging out

#### 3. **app/Login.tsx** (MODIFIED)

- Added imports: `registerForPushNotificationsAsync`, `sendPushTokenToBackend`
- `handleLogin`: Register push token after successful login

#### 4. **app/UserDetailScreen.tsx** (MODIFIED)

- Added imports: `registerForPushNotificationsAsync`, `sendPushTokenToBackend`
- `handleSubmit`: Register push token after successful signup

#### 5. **app/ListenerDetailScreen.tsx** (MODIFIED)

- Added imports: `registerForPushNotificationsAsync`, `sendPushTokenToBackend`
- Registration function: Register push token after successful signup

#### 6. **app.json** (MODIFIED)

```json
"notification": {
  "icon": "./assets/images/icon.png",
  "color": "#6b1fa8",
  "androidMode": "default",
  "androidCollapsedTitle": "New message"
}
```

### Backend

#### 7. **backend/src/models/user.model.js** (MODIFIED)

- Added field: `pushToken: { type: String, default: null }`

#### 8. **backend/src/controllers/user.controller.js** (MODIFIED)

- `updatePushToken`: Upsert push token for authenticated user
- `removePushToken`: Set pushToken to null for authenticated user

#### 9. **backend/src/routes/user.routes.js** (MODIFIED)

- Added imports: `updatePushToken`, `removePushToken`
- `POST /api/v1/users/update-push-token` - Update push token (protected)
- `POST /api/v1/users/remove-push-token` - Remove push token (protected)

#### 10. **backend/src/utils/pushNotification.js** (NEW)

- `sendPushNotification()` - Send single notification
- `sendBatchPushNotifications()` - Send multiple notifications
- Handles invalid tokens (DeviceNotRegistered)
- Auto-removes invalid tokens from DB

#### 11. **backend/src/controllers/profiles.controller.js** (MODIFIED)

- Added import: `sendPushNotification`
- `acceptProfile`: Send notification to User when Listener accepts match

#### 12. **backend/src/socket.js** (MODIFIED)

- Added import: `sendPushNotification`
- `send_message`: Send push notification if receiver is offline
- `endSession`: Send push notification to both parties if offline

## Notification Events Implemented

### 1. Match Accepted

- **Trigger**: Listener accepts User's invite (mutual match)
- **Recipient**: User
- **Title**: "Listener Matched 🎧"
- **Body**: "A listener has accepted your invite. You can start chatting now!"
- **Location**: `backend/src/controllers/profiles.controller.js`

### 2. Message Received

- **Trigger**: Message sent while receiver is offline
- **Recipient**: Message receiver
- **Title**: "New message from {SenderName}"
- **Body**: Message preview (first 50 chars)
- **Location**: `backend/src/socket.js` (send_message event)

### 3. Session Ended

- **Trigger**: Chat session ends
- **Recipient**: Both user and listener (if offline)
- **Title**: "Session Ended"
- **Body**: "Your session has ended. Thanks for being part of the conversation."
- **Location**: `backend/src/socket.js` (endSession function)

## Push Token Lifecycle

### On App Open

1. AuthContext checks if user is signed in
2. If signed in: Request notification permission
3. Generate Expo push token
4. Send token to backend via `POST /api/v1/users/update-push-token`
5. Token upserted in user's `pushToken` field

### On Login/Signup

1. User authenticates
2. Request notification permission
3. Generate Expo push token
4. Send token to backend
5. Token stored in DB

### On Logout

1. Call `POST /api/v1/users/remove-push-token`
2. Backend sets `pushToken = null`
3. User receives no notifications when logged out

### Token Updates

- Token automatically updated on every app open
- Tokens can change between app launches
- Invalid tokens auto-removed from DB

## Setup Required

### 1. Update Expo Project ID

In `components/utils/notifications.ts`, line 40:

```typescript
projectId: "your-expo-project-id"; // Replace with actual project ID from expo.dev
```

### 2. Android Build

Run prebuild to apply notification configuration:

```bash
npx expo prebuild --clean
```

### 3. Test Notifications

- Use physical device (push notifications don't work in emulator reliably)
- Ensure backend is running
- Test each notification event

## Testing Checklist

- [ ] App opens → push token registered
- [ ] Login → push token registered
- [ ] Signup → push token registered
- [ ] Logout → push token removed
- [ ] Match accepted → User receives notification
- [ ] Message while offline → Receiver gets notification
- [ ] Session ends while offline → Both parties get notification
- [ ] Foreground notifications display properly
- [ ] Notification tap opens app

## Package Installed

```bash
npx expo install expo-notifications expo-device
```

## Backend Dependencies

No new packages required - uses native `fetch` for Expo Push API.
