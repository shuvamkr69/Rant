# Token Refresh Implementation Guide

## Overview

This document describes the complete token management system implemented in the Rant app, including automatic token refresh, expiration tracking, and forced logout on refresh token expiration.

## Key Features

### 1. **Access Token Expiration Tracking**

- Access tokens are now stored with their expiration time
- The system tracks when tokens will expire and proactively refreshes them
- Token expiration is checked both synchronously (in-memory) and persisted to AsyncStorage

### 2. **Proactive Token Refresh**

- The app checks token expiration every 2 minutes when the user is signed in
- Tokens are automatically refreshed 5 minutes before expiration
- This prevents API calls from failing due to expired tokens

### 3. **Automatic Logout on Refresh Token Expiration**

- When the refresh token expires or becomes invalid, the app automatically logs out
- All tokens, cached data, and auth state are cleared
- User is redirected to the login/register screen

### 4. **Protected Routes**

- When logged out, users can only access:
  - Register screen
  - Login screen
  - UserDetailScreen (registration flow)
  - ListenerDetailScreen (registration flow)
- All other screens require authentication

## Implementation Details

### Modified Files

#### 1. `components/utils/tokenStorage.ts`

**Changes:**

- Added `accessTokenExpiry` in-memory variable to track expiration time
- Updated `setAccessToken()` to accept an optional `expiresIn` parameter (in seconds)
- Added `getAccessTokenExpiry()` to retrieve the expiration timestamp
- Added `isAccessTokenExpired()` to check if token is expired (with 1-minute buffer)
- Added `isAccessTokenExpiringSoon()` to check if token expires in less than 5 minutes
- Updated `initializeAccessToken()` to validate token expiration on app start
- Token expiration is stored in AsyncStorage for persistence across app restarts

**Key Functions:**

```typescript
// Store token with expiration time (default 15 minutes)
await setAccessToken(token, 900); // 900 seconds = 15 minutes

// Check if token needs refresh
if (isAccessTokenExpiringSoon()) {
  // Refresh token
}

// Check if token is expired
if (isAccessTokenExpired()) {
  // Force logout or refresh
}
```

#### 2. `components/contexts/authContext.tsx`

**Changes:**

- Added `refreshAccessToken()` function to handle proactive token refresh
- Implemented periodic token expiration check (every 2 minutes)
- Token is automatically refreshed when it expires in less than 5 minutes
- If refresh fails with 401 status, automatic logout is triggered
- Added dependency on `isSignedIn` to the useEffect to properly cleanup intervals

**Token Refresh Flow:**

```
1. Every 2 minutes, check if user is signed in
2. If signed in, check if access token is expiring soon
3. If expiring soon, call refresh endpoint
4. Store new access token and refresh token
5. If refresh fails with 401, trigger automatic logout
```

#### 3. `components/utils/api.ts`

**Changes:**

- Updated token storage in response interceptor to include expiration time
- When refreshing token after 401 error, the new token is stored with 15-minute expiration

**Error Handling:**

```
401 Error → Check if refresh needed
→ Skip for login/register/refresh endpoints
→ If already refreshing, queue the request
→ Call refresh token endpoint
→ Store new tokens with expiration
→ Retry original request
→ If refresh fails (401), force logout via event emitter
```

#### 4. `app/Login.tsx`, `app/UserDetailScreen.tsx`, `app/ListenerDetailScreen.tsx`

**Changes:**

- Updated all `setAccessToken()` calls to include expiration time: `await setAccessToken(token, 900)`
- This ensures tokens are properly tracked from the moment they're received

#### 5. `app/_layout.tsx`

**Changes:**

- Added `UserDetailScreen` to the logged-out stack (registration flow)
- Routing already properly restricts access based on `isSignedIn` status

## Token Lifecycle

### 1. **Login/Registration**

```
User logs in/registers
→ Receive access token & refresh token from backend
→ Store access token with 15-minute expiration
→ Store refresh token in secure storage
→ Set isSignedIn = true
→ Navigate to main app
```

### 2. **Normal Operation**

```
Every 2 minutes:
→ Check if user is signed in
→ Check if access token expires in < 5 minutes
→ If yes, proactively refresh the token
→ Store new token with fresh expiration
```

### 3. **API Call with Expired Token**

```
API call made
→ Access token expired
→ API returns 401
→ Interceptor catches 401
→ Call refresh endpoint
→ Store new tokens
→ Retry original request
```

### 4. **Refresh Token Expiration**

```
Token refresh attempted
→ Refresh token expired
→ Backend returns 401
→ Interceptor detects refresh failure
→ Clear all tokens and auth state
→ Emit FORCE_LOGOUT event
→ AuthContext receives event
→ Call signOut()
→ User redirected to login screen
```

## Configuration

### Token Expiration Times

- **Access Token**: 15 minutes (900 seconds)
  - Refreshed when < 5 minutes remaining
  - Considered expired with 1-minute buffer
- **Refresh Token**: Backend-configured (typically 7-30 days)

### Periodic Check Interval

- Checks run every **2 minutes** when user is signed in
- Can be adjusted in `authContext.tsx`:

```typescript
const tokenRefreshInterval = setInterval(
  async () => {
    // ... refresh logic
  },
  2 * 60 * 1000,
); // 2 minutes
```

## Testing the Implementation

### Test Cases

1. **Access Token Expiration**
   - Wait for access token to expire (or modify expiration time for testing)
   - Make an API call
   - Verify that token is automatically refreshed
   - Verify that API call succeeds

2. **Proactive Token Refresh**
   - Login and wait for token to be within 5 minutes of expiration
   - Verify that token is automatically refreshed in background
   - Check console logs for "⏰ [Auth] Access token expiring soon"

3. **Refresh Token Expiration**
   - Manually expire or invalidate the refresh token in backend
   - Wait for next refresh attempt or trigger an API call
   - Verify that app automatically logs out
   - Verify that user is on login/register screen
   - Verify that all tokens are cleared

4. **App Restart with Valid Token**
   - Login to the app
   - Close the app completely
   - Reopen the app
   - Verify that user remains logged in
   - Verify that token expiration is still tracked

5. **App Restart with Expired Token**
   - Login to the app
   - Wait for token to expire (or modify stored expiration)
   - Close and reopen the app
   - Verify that app attempts to refresh token
   - If refresh fails, verify user is logged out

6. **Route Protection**
   - When logged out, try to access protected screens
   - Verify that only Register, Login, UserDetailScreen, and ListenerDetailScreen are accessible
   - After login, verify that all screens are accessible

## Security Considerations

1. **Access Token Storage**
   - Stored in memory for fast synchronous access
   - Also stored in AsyncStorage for persistence
   - Automatically cleared on logout

2. **Refresh Token Storage**
   - Stored in Expo SecureStore (encrypted)
   - Falls back to AsyncStorage if SecureStore unavailable
   - Never exposed in memory for extended periods

3. **Token Expiration**
   - Access tokens expire quickly (15 minutes)
   - Refresh tokens expire based on backend configuration
   - Expired tokens are automatically cleared

4. **Network Security**
   - Tokens sent via Authorization header (Bearer token)
   - HTTPS enforced for all API calls
   - Backend validates tokens on every request

## Console Logs

The implementation includes comprehensive logging for debugging:

```
🔑 = Token storage operations
🔄 = Token refresh operations
⏰ = Token expiration checks
✅ = Success operations
❌ = Error operations
🔔 = Event notifications
🚪 = Logout operations
🧹 = Cleanup operations
```

## Troubleshooting

### Issue: Token not refreshing automatically

- Check console logs for "⏰ [Auth] Access token expiring soon"
- Verify that `isSignedIn` is true
- Check that periodic interval is running (every 2 minutes)

### Issue: App logs out unexpectedly

- Check backend logs for token validation errors
- Verify refresh token hasn't expired
- Check console for "❌ [Auth] Failed to refresh token" errors

### Issue: API calls failing with 401

- Verify access token is being sent in Authorization header
- Check if token has expired
- Verify backend is accepting the token format

### Issue: User remains logged in after token expiration

- Verify that periodic check is running
- Check if refresh token is still valid
- Review backend token expiration settings

## Backend Requirements

For this implementation to work correctly, the backend must:

1. **Issue tokens with proper expiration**
   - Access tokens should expire in 15 minutes
   - Refresh tokens should have longer expiration (7-30 days)

2. **Validate tokens on every request**
   - Check token expiration
   - Return 401 for expired/invalid tokens

3. **Provide refresh endpoint**
   - Endpoint: `POST /api/v1/users/refresh-token`
   - Request body: `{ refreshToken: string }`
   - Response: `{ accessToken: string, refreshToken: string }`
   - Return 401 if refresh token is expired/invalid

4. **Store refresh tokens**
   - Associate refresh token with user
   - Invalidate old refresh tokens when issuing new ones
   - Allow users to have multiple valid refresh tokens (multi-device)

## Future Enhancements

1. **Token Rotation**
   - Implement refresh token rotation for enhanced security
   - Invalidate old refresh tokens after use

2. **Multi-Device Management**
   - Track devices with active sessions
   - Allow users to revoke tokens from specific devices

3. **Biometric Re-authentication**
   - Require biometric authentication for sensitive operations
   - Re-authenticate when app returns from background

4. **Token Expiration from Backend**
   - Parse JWT to extract actual expiration time
   - Use backend-provided expiration instead of hardcoded values

5. **Offline Mode**
   - Allow limited functionality when tokens expire offline
   - Queue token refresh for when connection returns
