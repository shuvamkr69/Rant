# Token Refresh Implementation Guide

## Overview

This document describes the comprehensive JWT token refresh mechanism implemented to handle access token expiry automatically without requiring manual user logout.

## Problem Statement

Previously, when the access token expired:

- All API calls would fail with 401 errors
- The app would enter a broken state
- Users had to manually log out and log in again to recover
- No automatic token refresh was implemented

## Solution Architecture

### 1. Token Storage Strategy

**Access Token** (Short-lived, e.g., 7 days):

- Stored in **memory only** (not persisted)
- Cleared when app restarts
- Fast access for API requests
- Security: Cannot be extracted from device storage

**Refresh Token** (Long-lived, e.g., 30 days):

- Stored in **expo-secure-store** (encrypted hardware-backed storage)
- Persists across app restarts
- Fallback to AsyncStorage if SecureStore unavailable
- Used only to obtain new access tokens

### 2. Components

#### A. Token Storage Utility (`components/utils/tokenStorage.ts`)

**Functions:**

- `setAccessToken(token)` - Store access token in memory
- `getAccessToken()` - Retrieve access token from memory
- `clearAccessToken()` - Clear access token from memory
- `setRefreshToken(token)` - Store refresh token in SecureStore
- `getRefreshToken()` - Retrieve refresh token from SecureStore
- `clearRefreshToken()` - Clear refresh token from SecureStore
- `clearAllTokens()` - Clear both tokens completely
- `initializeAccessToken()` - One-time migration from AsyncStorage to memory

#### B. API Interceptors (`components/utils/api.ts`)

**Request Interceptor:**

- Gets access token from memory
- Adds `Authorization: Bearer <token>` header
- Logs request details for debugging

**Response Interceptor:**

- Detects 401 Unauthorized errors
- Implements token refresh logic with request queuing
- Handles concurrent requests during refresh
- Forces logout on refresh failure

**Token Refresh Flow:**

1. API call fails with 401
2. Check if already refreshing:
   - **Yes**: Queue the request
   - **No**: Start refresh process
3. Get refresh token from SecureStore
4. Call `/api/v1/users/refresh-token` endpoint
5. Receive new access token and refresh token
6. Update tokens in storage
7. Retry original request with new token
8. Process queued requests

**Failure Handling:**

- If refresh token is missing/invalid/expired:
  - Clear all tokens
  - Clear auth state
  - Emit `forceLogout` event
  - Redirect to login screen

### 3. Backend Changes

#### A. Refresh Token Controller (`backend/src/controllers/user.controller.js`)

**New Function: `refreshAccessToken`**

```javascript
POST /api/v1/users/refresh-token
Body: { refreshToken: "..." }
Response: { accessToken: "...", refreshToken: "..." }
```

**Process:**

1. Verify refresh token with JWT secret
2. Find user and validate stored refresh token matches
3. Generate new access token and refresh token
4. Update refresh token in database
5. Return both tokens to client

#### B. Updated Endpoints

**Login** (`POST /api/v1/users/login`):

- Now returns both `accessToken` and `refreshToken`

**Register** (`POST /api/v1/users/register`):

- Now returns both `accessToken` and `refreshToken`

### 4. Auth Context Updates (`components/contexts/authContext.tsx`)

**On App Start:**

- Migrates access token from AsyncStorage to memory (one-time)
- Initializes auth state
- Sets up force logout listener

**Force Logout Listener:**

- Listens for `forceLogout` custom event
- Triggered by API interceptor on refresh failure
- Clears all tokens and auth state
- Redirects user to login

**Sign Out:**

- Clears all tokens from memory and SecureStore
- Removes push token from backend (non-blocking)
- Clears auth state from AsyncStorage

### 5. Login/Register Updates

**Updated Files:**

- `app/Login.tsx`
- `app/UserDetailScreen.tsx` (User registration)
- `app/ListenerDetailScreen.tsx` (Listener registration)

**Changes:**

- Store both access and refresh tokens after successful auth
- Use `setAccessToken()` and `setRefreshToken()` instead of AsyncStorage
- Tokens now properly secured

## Security Improvements

1. **Access Token in Memory**: Not persisted to disk, cleared on app restart
2. **Refresh Token in SecureStore**: Encrypted, hardware-backed storage
3. **Token Rotation**: New refresh token issued on every refresh
4. **Automatic Logout**: Invalid/expired refresh tokens trigger immediate logout
5. **Request Queuing**: Prevents multiple simultaneous refresh attempts

## User Experience

### Before

- Access token expires → 401 errors → broken state
- User must manually logout → login → recover

### After

- Access token expires → automatic silent refresh → request succeeds
- User is unaware of token expiry
- Only logs out if refresh token is invalid (security breach or expiry)

## Testing Scenarios

### 1. Normal Token Refresh

- **Scenario**: Access token expires during normal use
- **Expected**: Silent refresh, user continues working
- **Test**: Wait for access token to expire, make API call

### 2. Concurrent Requests During Refresh

- **Scenario**: Multiple API calls when access token expires
- **Expected**: All requests queued, retried after refresh
- **Test**: Simulate multiple API calls with expired token

### 3. Refresh Token Expired

- **Scenario**: Refresh token is expired/invalid
- **Expected**: Automatic logout, redirect to login
- **Test**: Manually expire refresh token in database

### 4. App Restart

- **Scenario**: User closes and reopens app
- **Expected**: Access token re-fetched on first API call using refresh token
- **Test**: Close app, reopen, verify auth persists

### 5. Manual Logout

- **Scenario**: User explicitly logs out
- **Expected**: All tokens cleared, push token removed
- **Test**: Logout, verify storage cleared

## Configuration

### Environment Variables (Backend)

```env
ACCESS_TOKEN_SECRET=<your-secret>
REFRESH_TOKEN_SECRET=<your-secret>
ACCESS_TOKEN_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d
```

### Token Expiry Recommendations

- **Access Token**: 15 minutes to 7 days (currently 7 days)
- **Refresh Token**: 7 to 90 days (currently 30 days)
- Shorter access tokens = more frequent refreshes = more secure

## Troubleshooting

### Issue: TypeScript error on expo-secure-store

**Solution**: Install package, restart TypeScript server

```bash
npm install expo-secure-store
```

### Issue: Tokens not persisting after app restart

**Solution**: Ensure refresh token is stored in SecureStore, not memory

### Issue: Infinite refresh loop

**Solution**: Check refresh endpoint doesn't require auth header

### Issue: 401 errors still occurring

**Solution**: Verify backend returns both tokens on login/register

## Migration Notes

### Existing Users

- On first app open after update:
  - Access token migrated from AsyncStorage to memory
  - Future logins store refresh token in SecureStore
- Old tokens in AsyncStorage automatically cleaned up

### Development

- Clear app data during testing to reset token state
- Monitor console logs for refresh attempts
- Check SecureStore contents using React Native Debugger

## Future Enhancements

1. **Biometric Authentication**: Use refresh token with biometric lock
2. **Token Expiry Warning**: Notify user before refresh token expires
3. **Background Refresh**: Refresh access token in background before expiry
4. **Multiple Device Support**: Invalidate refresh tokens on other devices
5. **Analytics**: Track token refresh success/failure rates

## Security Considerations

1. **Never log refresh tokens**: Only log that refresh occurred
2. **Validate token ownership**: Backend checks token belongs to user
3. **Token rotation**: New refresh token on every refresh prevents reuse
4. **Immediate invalidation**: Logout clears refresh token from database
5. **HTTPS only**: Tokens transmitted over secure connections only

## Conclusion

This implementation provides a robust, secure, and user-friendly token refresh mechanism that:

- ✅ Automatically handles token expiry
- ✅ Prevents broken auth states
- ✅ Maintains security best practices
- ✅ Provides seamless user experience
- ✅ Handles edge cases and failures gracefully

Users will no longer need to manually logout and login when tokens expire. The app will handle token refresh automatically in the background, only logging out users when their refresh token is truly invalid or expired (after 30 days of inactivity).
