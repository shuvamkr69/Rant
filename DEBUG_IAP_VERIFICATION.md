# Debug IAP Verification Failure

## Steps to Debug "Failed to verify purchase" Error

### 1. Check Logcat for Detailed Logs

Run this command while attempting a purchase:

```powershell
adb logcat -s ReactNativeJS:* | Select-String "IAP|Premium|API|Backend"
```

Look for these key indicators:

#### ✅ Good Signs:

- `✅ [IAP] Purchase update received`
- `✅ [IAP] Backend verification response`
- `✅ [Backend] Subscription created`

#### ❌ Problem Signs:

- `❌ [API] Response error` - Backend returned error
- `❌ [IAP] Error verifying purchase` - Network or auth issue
- `401` status code - User not authenticated
- `Network Error` - Device can't reach backend

### 2. Common Issues & Fixes

#### Issue 1: User Not Authenticated

**Symptom:** `401` or "User not authenticated" in logs

**Fix:** Make sure you're logged in before purchasing:

1. Log out and log back in
2. Check AsyncStorage has `accessToken`

#### Issue 2: Backend Not Reachable

**Symptom:** `Network Error` or timeout in logs

**Check:**

```powershell
# Test from your device
adb shell "curl -v http://10.21.39.161:5000/health"
```

**Fix:**

- Ensure device and PC are on same WiFi
- Update IP in `.env` if changed:
  ```
  EXPO_PUBLIC_BACKEND_URL=http://YOUR_PC_IP:5000
  ```
- Rebuild app after changing `.env`

#### Issue 3: Backend Error

**Symptom:** `500` status code or backend exception in logs

**Check backend logs:**

```powershell
# Backend should show these logs during purchase:
🔵 [Backend] verifyPurchase called
🔵 [Backend] Request body: {...}
🔵 [Backend] User ID: ...
✅ [Backend] Subscription created
```

**Fix:** Check backend terminal for errors

### 3. Test Backend Directly

Test the verification endpoint manually:

```powershell
# Get your auth token first (check app logs or AsyncStorage)
$token = "YOUR_TOKEN_HERE"

# Test verification endpoint
$body = @{
    transactionId = "test_transaction_123"
    productId = "rant_premium_monthly"
    purchaseToken = "test_token_123"
    platform = "android"
    purchaseDate = (Get-Date).ToString("o")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://10.21.39.161:5000/subscription/verify" `
    -Method POST `
    -Headers @{"Authorization"="Bearer $token"; "Content-Type"="application/json"} `
    -Body $body
```

### 4. Enable Verbose Logging

All logs are already enabled! Just watch logcat during purchase.

### 5. Quick Fixes to Try

1. **Clear app data and reinstall:**

   ```powershell
   adb uninstall com.flaminco.rant
   adb install C:\Users\KIIT\OneDrive\Desktop\RantApp-debug.apk
   ```

2. **Restart backend server:**

   ```powershell
   cd C:\Users\KIIT\Documents\Rant\backend
   npm start
   ```

3. **Check device is on correct network:**
   ```powershell
   adb shell "ip addr show wlan0"
   ```

### 6. Expected Successful Flow

```
🔵 [Premium] handlePurchase called
🔵 [Premium] Calling purchaseSubscription...
✅ [IAP] Purchase initiated
✅ [IAP] Purchase update received
🔵 [Premium] Verifying purchase with backend...
🔵 [API] Request: POST /subscription/verify
✅ [API] Response: 200 {success: true}
✅ [Premium] Purchase verified successfully!
✅ [Backend] Subscription created
```

### 7. Get Logs Now

Run purchase again and save logs:

```powershell
adb logcat -s ReactNativeJS:* > C:\Users\KIIT\Desktop\iap-logs.txt
```

Then share the `iap-logs.txt` file to see what's failing.
