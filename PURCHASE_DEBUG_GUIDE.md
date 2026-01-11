# Purchase Flow Debug Guide

## What You'll See When Testing

After installing the new debug build, when you attempt to purchase, you'll see these **visible alerts** on screen:

### Expected Successful Flow:

1. **Alert 1: "DEBUG: Step 1"**

   - "Purchase received from Play Store"
   - **Appears immediately after Google Play confirms payment**
   - If you don't see this: Purchase didn't complete with Play Store

2. **Alert 2: "DEBUG: Step 2"**

   - "Verifying with backend..."
   - Shows product ID and transaction ID
   - **Appears when sending request to your backend**
   - If you don't see this after Step 1: App crashed between steps

3. **Alert 3a: "✅ DEBUG: Step 3 - SUCCESS"** (if verification succeeds)
   - "Backend verified the purchase!"
   - "Your premium subscription is now active!"
   - **This means everything worked!**

### Possible Error Scenarios:

**Alert 3b: "❌ DEBUG: Step 3 - ERROR"**

- Shows status code and error message from backend
- Common errors:
  - **Status 401**: "User not authenticated" → You need to log in
  - **Status 409**: "Transaction already processed" → Already subscribed
  - **Status 400**: "Missing required purchase information" → Data issue
  - **Status 500**: Backend error → Check backend logs
  - **No status + "Network Error"**: Can't reach backend → Check WiFi/IP

**Alert 3c: "❌ DEBUG: Step 3 - FAILED"**

- Backend returned but said verification=false
- Rare, usually means backend logic issue

## On App Launch:

**Alert: "⚠️ DEBUG: Not Logged In"**

- Appears if you're not authenticated
- **Fix**: Log out and log back in before purchasing

## How to Test:

### Test 1: Successful Purchase

1. Make sure you're logged in
2. Make sure backend is running (`npm start` in backend folder)
3. Make sure device and PC are on same WiFi
4. Click "Subscribe Now"
5. Complete Google Play payment
6. Watch for the 3 debug alerts in sequence

### Test 2: Check Auth

1. Open Premium screen
2. If you see "Not Logged In" alert → log in first
3. If no alert → you're authenticated

### Test 3: Backend Connectivity

Before purchasing, test if backend is reachable:

```powershell
# From PC - get device IP
adb shell "ip addr show wlan0 | grep inet"

# Update .env if needed
# EXPO_PUBLIC_BACKEND_URL=http://YOUR_PC_IP:5000
```

## Interpreting Results:

### Scenario A: No alerts at all

→ Purchase never reached app
→ Check if Google Play is working

### Scenario B: Only Step 1 alert

→ App received purchase but crashed before verification
→ Check if you're logged in

### Scenario C: Step 1 + Step 2 alerts only

→ Backend request sent but no response
→ Check backend is running
→ Check device can reach PC (WiFi)
→ Look at error details in Step 3 alert

### Scenario D: All 3 alerts, Step 3 = ERROR

→ Backend responded with error
→ Read the status code and message
→ 401 = Log in first
→ 500 = Check backend terminal for error logs

### Scenario E: All 3 alerts, Step 3 = SUCCESS

→ **Everything worked!**
→ You're now premium

## Next Steps After Testing:

Once you identify the issue from the alert messages, I can help fix:

- Auth issues → Check token storage
- Backend connectivity → Update IP/URL
- Backend errors → Fix server code
- Purchase data issues → Fix IAP integration

## Remove Debug Alerts Later:

Once you've identified and fixed the issue, we'll remove these debug alerts and keep only the final success/error messages.
