# Token Refresh Testing Guide

## Quick Start Testing

### 1. Test New User Registration

```
1. Open app → Click "Register as User"
2. Fill in details and submit
3. ✅ Check logs: "🔐 Refresh token stored securely"
4. ✅ Check logs: "🔑 Access token stored in memory"
5. ✅ Navigate to home screen successfully
```

### 2. Test Login

```
1. Login with mobile number "1"
2. ✅ Check logs: "🔐 Refresh token stored securely"
3. ✅ Check logs: "🔑 Access token stored in memory"
4. ✅ Navigate to tabs successfully
5. Make any API call
6. ✅ Verify request has Authorization header
```

### 3. Test App Restart (Token Persistence)

```
1. Login successfully
2. Close app completely
3. Reopen app
4. ✅ Should remain logged in
5. Make API call
6. ✅ First request might trigger refresh if access token missing
7. ✅ Request succeeds after refresh
```

### 4. Test Token Refresh (Manual)

#### Backend Setup - Reduce Token Expiry (for testing)

```javascript
// backend/src/models/user.model.js
// Change ACCESS_TOKEN_EXPIRY from "7d" to "30s"

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "30s", // Changed from "7d" for testing
    }
  );
};
```

#### Test Steps

```
1. Login successfully
2. Wait 35 seconds (access token expires)
3. Make any API call (e.g., navigate to Chats tab)
4. ✅ Check logs: "🔄 [Token Refresh] 401 detected, attempting token refresh..."
5. ✅ Check logs: "🔄 [Token Refresh] Calling refresh endpoint..."
6. ✅ Check logs: "✅ [Token Refresh] New tokens received"
7. ✅ Check logs: "✅ [Token Refresh] Retrying original request"
8. ✅ Original API call succeeds
9. ✅ User sees data, no error message
```

### 5. Test Concurrent Requests During Refresh

```
1. Login successfully
2. Wait for access token to expire (35 seconds with test setup)
3. Quickly navigate between tabs (triggers multiple API calls)
4. ✅ Check logs: "⏳ [Token Refresh] Already refreshing, queuing request..."
5. ✅ Verify only ONE refresh request made
6. ✅ All queued requests succeed after refresh
```

### 6. Test Refresh Token Expired

#### Backend Setup - Manually Expire Refresh Token

```javascript
// In MongoDB or your database tool:
db.users.updateOne(
  { mobileNumber: "1" },
  { $set: { refreshToken: "invalid_token" } }
);
```

#### Test Steps

```
1. Login successfully
2. Manually invalidate refresh token in database (see above)
3. Wait for access token to expire
4. Make any API call
5. ✅ Check logs: "❌ [Token Refresh] Failed: ..."
6. ✅ Check logs: "🚪 [Token Refresh] Invalid/missing refresh token, forcing logout"
7. ✅ Check logs: "✅ [Token Refresh] Forced logout complete"
8. ✅ User automatically redirected to login screen
9. ✅ All tokens cleared from storage
```

### 7. Test Manual Logout

```
1. Login successfully
2. Navigate to Settings → Logout
3. ✅ Check logs: "🔓 Signing out - Removing tokens from storage"
4. ✅ Check logs: "🧹 Access token cleared from memory"
5. ✅ Check logs: "🧹 Refresh token cleared from secure storage"
6. ✅ Check logs: "🧹 All tokens cleared"
7. ✅ Redirected to login screen
8. ✅ Cannot make authenticated API calls
```

## Verification Checklist

### ✅ Token Storage

- [ ] Access token stored in memory (not AsyncStorage)
- [ ] Refresh token stored in SecureStore
- [ ] Access token cleared on app restart
- [ ] Refresh token persists across app restarts

### ✅ API Interceptors

- [ ] Request interceptor adds Authorization header
- [ ] Response interceptor detects 401 errors
- [ ] Token refresh triggered on 401
- [ ] Original request retried after refresh
- [ ] Concurrent requests queued during refresh

### ✅ Auth Flow

- [ ] Login stores both tokens
- [ ] Register stores both tokens
- [ ] Logout clears all tokens
- [ ] Force logout works on refresh failure

### ✅ User Experience

- [ ] No visible errors during token refresh
- [ ] User unaware of token expiry
- [ ] Seamless navigation during refresh
- [ ] Only logs out when truly necessary

## Expected Log Output

### Successful Token Refresh

```
🔵 [API] Request: {method: "GET", url: "/api/v1/users/profiles", hasToken: true}
❌ [API] Response error: {status: 401, message: "jwt expired"}
🔄 [Token Refresh] 401 detected, attempting token refresh...
🔄 [Token Refresh] Calling refresh endpoint...
✅ [Token Refresh] New tokens received
🔑 Access token stored in memory
🔐 Refresh token stored securely
✅ [Token Refresh] Retrying original request
🔵 [API] Request: {method: "GET", url: "/api/v1/users/profiles", hasToken: true}
✅ [API] Response: {status: 200, data: [...]}
```

### Failed Refresh (Force Logout)

```
🔵 [API] Request: {method: "GET", url: "/api/v1/users/profiles", hasToken: true}
❌ [API] Response error: {status: 401, message: "jwt expired"}
🔄 [Token Refresh] 401 detected, attempting token refresh...
🔄 [Token Refresh] Calling refresh endpoint...
❌ [Token Refresh] Failed: {status: 401, message: "Invalid refresh token"}
🚪 [Token Refresh] Invalid/missing refresh token, forcing logout
🧹 Access token cleared from memory
🧹 Refresh token cleared from secure storage
🧹 All tokens cleared
✅ [Token Refresh] Forced logout complete
🔔 [Auth] Received force logout event: {reason: "token_refresh_failed"}
```

### Normal Login

```
🔵 [API] Request: {method: "POST", url: "/api/v1/users/login", hasToken: false}
✅ [API] Response: {status: 200, data: {accessToken: "...", refreshToken: "..."}}
🔑 Access token stored in memory
🔐 Refresh token stored securely
```

## Common Issues & Solutions

### Issue: "Cannot find module 'expo-secure-store'"

**Solution:**

```bash
npm install expo-secure-store --save
npx expo prebuild --clean
```

### Issue: Refresh token not persisting

**Verify:**

```javascript
// In React Native Debugger console:
import * as SecureStore from "expo-secure-store";
SecureStore.getItemAsync("refreshToken").then(console.log);
```

### Issue: Infinite refresh loop

**Check:**

- Refresh endpoint `/api/v1/users/refresh-token` doesn't require auth
- Refresh endpoint is excluded in interceptor
- Backend returns valid tokens in response

### Issue: 401 errors after refresh

**Verify:**

- New access token properly stored in memory
- Request interceptor using `getAccessToken()` not AsyncStorage
- Authorization header updated with new token

## Performance Testing

### Test Load

```
1. Login successfully
2. Let access token expire
3. Open 10 tabs quickly (triggers 10 API calls)
4. ✅ Verify only 1 refresh request made
5. ✅ All 10 requests succeed
6. ✅ Response time reasonable (<3 seconds total)
```

### Test Battery Impact

```
1. Login successfully
2. Use app normally for 30 minutes
3. ✅ No excessive battery drain
4. ✅ No memory leaks
5. ✅ Smooth navigation throughout
```

## Security Testing

### Test Token Extraction

```
1. Login successfully
2. Use Android Studio Device File Explorer
3. Navigate to app data directory
4. ✅ Access token NOT found in any file
5. ✅ Refresh token in secure storage (encrypted)
6. ✅ No tokens in SharedPreferences/AsyncStorage
```

### Test Token Reuse

```
1. Login on Device A
2. Extract refresh token from Device A
3. Try to use on Device B
4. ✅ Refresh token rotates on each use
5. ✅ Old refresh token invalidated
6. ✅ Device A logged out after Device B refresh
```

## Automated Testing Script

```javascript
// test-token-refresh.js
import { api } from "./components/utils/api";
import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
} from "./components/utils/tokenStorage";

async function testTokenRefresh() {
  console.log("🧪 Starting Token Refresh Test...");

  // 1. Login
  const loginResponse = await api.post("/api/v1/users/login", {
    mobileNumber: "1",
  });

  const { accessToken, refreshToken } = loginResponse.data;
  setAccessToken(accessToken);
  await setRefreshToken(refreshToken);

  console.log("✅ Login successful");

  // 2. Wait for token to expire (30 seconds)
  console.log("⏳ Waiting 35 seconds for token to expire...");
  await new Promise((resolve) => setTimeout(resolve, 35000));

  // 3. Make API call (should trigger refresh)
  console.log("🔄 Making API call with expired token...");
  const profileResponse = await api.get("/api/v1/users/myProfile");

  if (profileResponse.status === 200) {
    console.log("✅ Token refresh test PASSED!");
    console.log("✅ Original request succeeded after refresh");
  } else {
    console.log("❌ Token refresh test FAILED!");
  }
}

// Run test
testTokenRefresh();
```

## Production Readiness Checklist

- [ ] Backend token expiry configured (ACCESS_TOKEN_EXPIRY="7d", REFRESH_TOKEN_EXPIRY="30d")
- [ ] SecureStore fallback to AsyncStorage working
- [ ] Error logging configured (Sentry/similar)
- [ ] Token refresh analytics tracked
- [ ] Documentation updated
- [ ] Team trained on new flow
- [ ] Tested on iOS (if applicable)
- [ ] Tested on Android (physical device)
- [ ] Tested on low-end devices
- [ ] Tested with slow network
- [ ] Tested with offline → online transition

## Rollback Plan

If issues occur in production:

1. **Immediate**: Increase `ACCESS_TOKEN_EXPIRY` to 30 days (reduces refresh frequency)
2. **Short-term**: Revert to old `api.ts` (without refresh logic)
3. **Long-term**: Fix issues, test thoroughly, re-deploy

## Next Steps

1. ✅ Backend: Deploy refresh endpoint
2. ✅ Frontend: Deploy new token storage
3. ⏳ Testing: Run all test scenarios
4. ⏳ Monitoring: Watch for refresh failures
5. ⏳ Optimization: Proactive refresh before expiry
6. ⏳ Enhancement: Background refresh service

---

**Remember:** Test thoroughly before deploying to production! Token management is critical for security and user experience.
