# Token Authentication Issue - Complete Fix

## Problem Summary

The Socket.io "not matched" errors were caused by **stale JWT tokens** in AsyncStorage. When switching between User and Listener accounts, the old token remained cached, causing the socket to authenticate with the wrong user ID.

## Root Causes Identified

### 1. **Token Not Cleared on Login/Register**

- **Login.tsx**: ✅ FIXED - Now clears old token before saving new one
- **Register.tsx**: ✅ FIXED - Now clears old token before saving new one

### 2. **Socket Doesn't Reconnect on Token Change**

- **ChatContext**: Socket initialized once on mount with whatever token exists
- **Problem**: If you login after the socket is already initialized, it keeps using the old token
- **Fix**: Added `reconnectSocket()` function to manually force reconnection

### 3. **isSignedIn State Persists**

- **AuthContext**: Stores both `accessToken` and `isSignedIn` in AsyncStorage
- **Problem**: Clearing only token leaves isSignedIn=true
- **Fix**: Now clears BOTH on logout and before new login

## Complete Solution

### Files Modified

#### 1. `app/Login.tsx`

```typescript
const handleLogin = async () => {
  // Log old token
  const oldToken = await AsyncStorage.getItem("accessToken");
  console.log("🔓 Old token:", oldToken ? oldToken.substring(0, 20) + "..." : "none");

  // Get new token from API
  const response = await api.post("/api/v1/users/login", {...});

  if (response.status === 200) {
    // Clear ALL old credentials
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("isSignedIn");

    // Save new token
    await AsyncStorage.setItem("accessToken", response.data.accessToken);
    await signIn();
  }
};

const handleClearToken = async () => {
  await AsyncStorage.removeItem("accessToken");
  await AsyncStorage.removeItem("isSignedIn"); // CRITICAL
  alert("Token cleared! Please restart the app or login fresh.");
};
```

#### 2. `app/Register.tsx`

```typescript
const handleRegister = async () => {
  const response = await api.post("/api/v1/users/register", {...});

  if (response.status === 201) {
    // Clear old credentials BEFORE saving new ones
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("isSignedIn");

    // Save new token
    await AsyncStorage.setItem("accessToken", response.data.accessToken);
    await signIn();
  }
};
```

#### 3. `components/contexts/chatContext.tsx`

```typescript
// Added reconnectSocket function
const reconnectSocket = async () => {
  console.log("🔄 Manually reconnecting socket with fresh token...");

  // Completely destroy old socket
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    setSocket(null);
  }

  // Wait for clean disconnect
  await new Promise(resolve => setTimeout(resolve, 500));

  // Create fresh socket with new token
  await initSocket();
};

// Export in context
return (
  <ChatContext.Provider value={{
    ...other,
    reconnectSocket, // NEW
  }}>
```

#### 4. `backend/src/socket.js`

```javascript
// Enhanced logging
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  console.log(
    "🔐 Socket auth - Token (first 20):",
    token.substring(0, 20) + "..."
  );

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  console.log("🔓 Socket auth - Decoded user ID:", decoded._id);

  socket.userId = decoded._id;
  next();
});
```

## Testing Procedure

### Step 1: Clear Everything

```bash
# On BOTH devices:
1. Press "Clear Cached Token" button on Login screen
2. Force close the app
3. Reopen the app
```

### Step 2: Register/Login Fresh

```bash
# Device 1 (User):
1. Login with User credentials
2. Check console: "🔓 Old token: none"
3. Check console: "🔐 New token: [first 20 chars]"
4. Check console: "✅ Socket connected with ID: [socket-id]"
5. Check backend: "✅ User connected: [user-id]"

# Device 2 (Listener):
1. Login with Listener credentials
2. Same checks as above
3. Backend should show DIFFERENT user IDs
```

### Step 3: Verify Socket Authentication

```bash
# Backend console should show:
🔐 Socket auth - Token (first 20): eyJhbGciOiJIUzI1NiIs...
🔓 Socket auth - Decoded user ID: 68f1d605b806e299835af82d
✅ User connected: 68f1d605b806e299835af82d (Socket: abc123)

🔐 Socket auth - Token (first 20): eyJhbGciOiJIUzI1NiIs... (DIFFERENT)
🔓 Socket auth - Decoded user ID: 68f1d605b806e299835af830 (DIFFERENT)
✅ User connected: 68f1d605b806e299835af830 (Socket: def456)
```

### Step 4: Test Messaging

```bash
# User sends message to Listener:
Frontend: 📤 Sending message: { receiverId: "68f1...", message: "Hi" }
Backend: 💬 Message from 68f1d605b806e299835af82d to 68f1d605b806e299835af830
Backend: ✅ Match verified
Backend: ✅ Message delivered to 68f1d605b806e299835af830
```

## Common Issues & Solutions

### Issue 1: "SenderId equals ReceiverId"

**Cause**: Both devices have the same token
**Solution**:

1. Clear token on BOTH devices
2. Login fresh on each device
3. Check backend logs show DIFFERENT user IDs connecting

### Issue 2: "Socket not connected"

**Cause**: Socket initialized before login
**Solution**:

1. After login, call `reconnectSocket()` if available
2. Or restart the app

### Issue 3: "Match verification failed"

**Cause**: Database has profiles but socket auth is wrong
**Solution**:

1. Verify BOTH users connected with different IDs in backend logs
2. Check token is fresh (compare first 20 chars in logs)
3. Verify Profile records exist with correct userIds

### Issue 4: Token persists after logout

**Cause**: Only clearing `accessToken`, not `isSignedIn`
**Solution**: Always clear BOTH:

```typescript
await AsyncStorage.removeItem("accessToken");
await AsyncStorage.removeItem("isSignedIn");
```

## Verification Checklist

Before testing chat:

- [ ] Backend console shows 2 different user IDs connected
- [ ] Frontend console shows different token prefixes on each device
- [ ] Each device can see their correct userType in profile
- [ ] Database has mutual accepted Profile records
- [ ] Socket connection logs show correct authentication

## Debug Commands

### Check current token on device:

```javascript
const token = await AsyncStorage.getItem("accessToken");
console.log("Current token:", token.substring(0, 20));
```

### Force socket reconnection:

```javascript
const { reconnectSocket } = useChat();
await reconnectSocket();
```

### Verify token decoding:

```javascript
// In backend
const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
console.log("Token belongs to user:", decoded._id);
```

## Prevention

### Always follow this pattern for auth:

```typescript
// 1. Clear old credentials
await AsyncStorage.removeItem("accessToken");
await AsyncStorage.removeItem("isSignedIn");

// 2. Get new credentials from API
const response = await api.post("/auth/endpoint");

// 3. Save new credentials
await AsyncStorage.setItem("accessToken", response.data.accessToken);
await signIn(); // Sets isSignedIn=true

// 4. Navigate to authenticated area
navigation.replace("/(tabs)");
```

### On app startup:

```typescript
// AuthContext checks both
const storedState = await AsyncStorage.getItem("isSignedIn");
const accessToken = await AsyncStorage.getItem("accessToken");

// Both must be present and valid
if (storedState === "true" && accessToken) {
  setIsSignedIn(true);
}
```

## Expected Logs (Success)

### Device 1 (User - ID: 68f1d605b806e299835af82d)

```
🔓 Old token before login: none
📱 Login response: { user: {...}, accessToken: "eyJhbG..." }
🗑️ Old credentials cleared
🔐 New token (first 20 chars): eyJhbGciOiJIUzI1NiIs...
✅ Login complete, navigating to tabs
🔌 Initializing socket with token: eyJhbGciOiJIUzI1NiIs...
🔌 Connecting to socket server: http://192.168.x.x:5000
✅ Socket connected with ID: abc123def456
```

### Device 2 (Listener - ID: 68f1d605b806e299835af830)

```
🔓 Old token before login: none
📱 Login response: { user: {...}, accessToken: "eyJhbG..." }
🗑️ Old credentials cleared
🔐 New token (first 20 chars): eyJhbGciOiJIUzI1NiIs... (DIFFERENT)
✅ Login complete, navigating to tabs
🔌 Initializing socket with token: eyJhbGciOiJIUzI1NiIs... (DIFFERENT)
✅ Socket connected with ID: xyz789ghi012
```

### Backend

```
🔐 Socket auth - Token (first 20): eyJhbGciOiJIUzI1NiIs...
🔓 Socket auth - Decoded user ID: 68f1d605b806e299835af82d
✅ User connected: 68f1d605b806e299835af82d (Socket: abc123def456)
👥 Total connected users: 1

🔐 Socket auth - Token (first 20): eyJhbGciOiJIUzI1NiIs... (DIFFERENT)
🔓 Socket auth - Decoded user ID: 68f1d605b806e299835af830 (DIFFERENT)
✅ User connected: 68f1d605b806e299835af830 (Socket: xyz789ghi012)
👥 Total connected users: 2
```

## Next Steps

1. **Test the fix**:

   - Clear tokens on both devices
   - Login fresh
   - Verify different user IDs in backend logs
   - Test messaging

2. **If still not working**:

   - Share the complete console logs from BOTH devices
   - Share backend logs showing socket connections
   - Verify token first 20 characters are DIFFERENT on each device

3. **Long-term improvements**:
   - Add token expiration handling
   - Add automatic socket reconnection on token refresh
   - Add visual indicator showing socket connection status
   - Add logout functionality that properly cleans up everything
