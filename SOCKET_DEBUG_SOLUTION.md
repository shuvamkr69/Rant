# Socket.io Chat Issue - SOLUTION

## Problem Identified

From the backend logs:

```
💬 Message from 68f1d605b806e299835af82d to 68f1d605b806e299835af82d: Hi
📊 SenderId type: string 68f1d605b806e299835af82d
📊 ReceiverId type: string 68f1d605b806e299835af82d
```

**The User is sending a message to THEMSELVES!**

## Root Cause

The User device has the **Listener's auth token** stored in AsyncStorage.

When the socket connects, it uses the token from AsyncStorage to identify the user. The backend extracts the userId from the JWT:

```javascript
const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
socket.userId = decoded._id; // This is the Listener's ID!
```

So even though the User opened the chat screen with the correct `receiverId`, when they send a message, the socket's `senderId` is the Listener's ID (from the JWT).

## Why This Happened

Scenario:

1. You logged in as **Listener** on Device A
2. Token saved to AsyncStorage: `{ userId: "68f1d605b806e299835af82d" }`
3. You then logged in as **User** on the same device OR different device
4. But the old Listener token is still in AsyncStorage
5. Socket.io connects using the old token
6. All messages appear to come from the Listener

## Solution

### Option 1: Logout and Login Again (Quick Fix)

**On the User device:**

1. Go to Settings
2. Click Logout
3. Login again with User credentials
4. This will clear old tokens and get a fresh JWT

### Option 2: Clear AsyncStorage on Login (Permanent Fix)

Update the Login screen to clear old tokens before saving new ones:

```typescript
// In Login.tsx, in the handleLogin function:
const handleLogin = async () => {
  try {
    const response = await api.post("/api/v1/users/login", {
      mobileNumber: formData.mobileNumber,
    });

    if (response.status === 200) {
      // CLEAR OLD TOKEN FIRST!
      await AsyncStorage.removeItem("accessToken");

      // Save new token
      await AsyncStorage.setItem("accessToken", response.data.accessToken);
      await signIn();
      navigation.replace("/(tabs)");
    }
  } catch (error) {
    console.log("Login failed:", error);
  }
};
```

### Option 3: Force Socket Reconnection

Add a reconnect function in ChatContext that can be called manually:

```typescript
const reconnectSocket = async () => {
  if (socket) {
    socket.disconnect();
  }
  await initSocket();
};
```

## How to Verify the Fix

1. **Check backend console when app loads:**

   ```
   ✅ User connected: <CORRECT_USER_ID> (Socket: ...)
   ```

2. **Check frontend console when sending message:**

   ```
   📤 Sending message: { receiverId: "...", socketConnected: true }
   📨 Emitting send_message event to: ...
   ```

3. **Backend should show:**
   ```
   💬 Message from <USER_ID> to <LISTENER_ID>: Hello
   🔍 Final match result: true
   ✅ Match verified, saving message...
   ```

## Backend Logs Explained

**Good logs (Listener sending to User):**

```
💬 Message from 68f1d605b806e299835af82d to 68f126e84edddd952e8af99a: Hei
✅ Match verified, saving message...
```

- ✅ Different sender and receiver
- ✅ Match found in both directions
- ✅ Message saved successfully

**Bad logs (User trying to send):**

```
💬 Message from 68f1d605b806e299835af82d to 68f1d605b806e299835af82d: Hi
🔍 User1 accepted User2: false
🔍 User2 accepted User1: false
❌ Match verification failed!
```

- ❌ Same sender and receiver (wrong token)
- ❌ No match found (can't match with yourself)
- ❌ Message blocked

## Prevention

Always clear tokens when:

1. Logging out
2. Logging in (before saving new token)
3. Switching accounts
4. App initialization (if token is invalid)

Add this to app/\_layout.tsx:

```typescript
useEffect(() => {
  const validateToken = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      try {
        // Verify token is valid by calling a protected endpoint
        await api.get("/api/v1/users/myProfile");
      } catch (error) {
        // Token invalid, clear it
        console.log("Invalid token, clearing...");
        await AsyncStorage.removeItem("accessToken");
        await signOut();
      }
    }
  };

  validateToken();
}, []);
```

## Quick Commands to Test

```bash
# Restart backend with logs
cd backend
npm run dev

# Watch for:
# ✅ User connected: <ID>
# Check if ID matches the logged-in user
```

## Summary

**The code is correct!** The issue is just that the User device has the wrong auth token. Once you logout/login on the User device, everything will work perfectly. Both directions of messaging work fine when the tokens are correct. ✅
