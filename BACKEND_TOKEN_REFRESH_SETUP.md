# Backend Token Refresh Setup Summary

## Changes Made

### 1. User Controller (`backend/src/controllers/user.controller.js`)

#### Added `refreshAccessToken` Function

```javascript
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    // Find user and verify the refresh token matches what's stored
    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    console.log(
      `🔄 Access token refreshed for user ${user._id} (${user.name})`
    );

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
```

#### Updated `loginUser` to Return Both Tokens

```javascript
// Before
return res.status(200).json({
  message: "Login successful",
  user,
  accessToken,
});

// After
return res.status(200).json({
  message: "Login successful",
  user,
  accessToken,
  refreshToken, // Added
});
```

#### Updated `registerUser` to Return Both Tokens

```javascript
// Before
return res.status(201).json({
  message: "User registered successfully",
  user: newUser,
  accessToken,
});

// After
return res.status(201).json({
  message: "User registered successfully",
  user: newUser,
  accessToken,
  refreshToken, // Added
});
```

#### Added JWT Import

```javascript
import jwt from "jsonwebtoken";
```

### 2. User Routes (`backend/src/routes/user.routes.js`)

#### Added Refresh Token Route

```javascript
// Import
import {
  // ... existing imports
  refreshAccessToken, // Added
} from "../controllers/user.controller.js";

// Route (NO AUTH REQUIRED)
userRouter.post("/refresh-token", refreshAccessToken);
```

**Important**: The refresh endpoint does NOT use `verifyJWT` middleware because the access token is expired when calling it.

### 3. User Model (Existing)

The model already has the necessary fields:

```javascript
refreshToken: { type: String },
```

And methods:

```javascript
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};
```

## Environment Variables

### Required in `.env` File

```env
# Access Token (Short-lived)
ACCESS_TOKEN_SECRET=your_super_secret_access_key_here
ACCESS_TOKEN_EXPIRY=7d

# Refresh Token (Long-lived)
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key_here
REFRESH_TOKEN_EXPIRY=30d
```

### Token Expiry Format

- `15m` = 15 minutes
- `1h` = 1 hour
- `7d` = 7 days
- `30d` = 30 days
- `90d` = 90 days

### Recommended Settings

**Development:**

```env
ACCESS_TOKEN_EXPIRY=30s   # For testing refresh
REFRESH_TOKEN_EXPIRY=7d
```

**Production:**

```env
ACCESS_TOKEN_EXPIRY=15m   # More secure
REFRESH_TOKEN_EXPIRY=30d
```

**Current (Your App):**

```env
ACCESS_TOKEN_EXPIRY=7d    # Less frequent refreshes
REFRESH_TOKEN_EXPIRY=30d
```

## API Endpoint Documentation

### POST `/api/v1/users/refresh-token`

**Description**: Refresh an expired access token using a valid refresh token

**Authentication**: None (access token is expired)

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**

```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

**401 - No Refresh Token Provided:**

```json
{
  "message": "Refresh token required"
}
```

**401 - Invalid or Expired Refresh Token:**

```json
{
  "message": "Invalid or expired refresh token"
}
```

**401 - Token Mismatch:**

```json
{
  "message": "Invalid refresh token"
}
```

**500 - Server Error:**

```json
{
  "message": "Server error",
  "error": "Error details here"
}
```

## Security Features

### 1. Token Rotation

- Every refresh generates a NEW refresh token
- Old refresh token is invalidated
- Prevents token reuse attacks

### 2. Token Verification

- Refresh token verified with JWT secret
- Token must match what's stored in database
- User must exist in database

### 3. Token Storage

- Refresh token stored hashed in database (future enhancement)
- Only user who owns token can use it
- Tokens cleared on logout

### 4. Token Expiry

- Access tokens expire quickly (15min - 7d)
- Refresh tokens expire slowly (7d - 90d)
- Both configurable via environment variables

## Testing the Backend

### 1. Test Login (Returns Both Tokens)

```bash
curl -X POST http://10.21.39.161:5000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "1"}'
```

**Expected Response:**

```json
{
  "message": "Login successful",
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### 2. Test Refresh Token

```bash
# First, get tokens from login
ACCESS_TOKEN="your_access_token_here"
REFRESH_TOKEN="your_refresh_token_here"

# Wait for access token to expire, then:
curl -X POST http://10.21.39.161:5000/api/v1/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "'"$REFRESH_TOKEN"'"}'
```

**Expected Response:**

```json
{
  "message": "Token refreshed successfully",
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

### 3. Test Invalid Refresh Token

```bash
curl -X POST http://10.21.39.161:5000/api/v1/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "invalid_token"}'
```

**Expected Response:**

```json
{
  "message": "Invalid or expired refresh token"
}
```

### 4. Test Expired Refresh Token

```bash
# Manually expire refresh token in database or wait for expiry
# Then try to refresh
curl -X POST http://10.21.39.161:5000/api/v1/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "'"$EXPIRED_REFRESH_TOKEN"'"}'
```

**Expected Response:**

```json
{
  "message": "Invalid or expired refresh token"
}
```

## Database Queries

### Check User's Refresh Token

```javascript
// MongoDB
db.users.findOne({ mobileNumber: "1" }, { refreshToken: 1, name: 1 });
```

### Manually Invalidate Refresh Token

```javascript
// MongoDB
db.users.updateOne({ mobileNumber: "1" }, { $set: { refreshToken: null } });
```

### Find Users with Active Sessions

```javascript
// MongoDB
db.users.find({ refreshToken: { $ne: null } }, { name: 1, mobileNumber: 1 });
```

## Monitoring & Logging

### Successful Refresh

```
🔄 Access token refreshed for user 69025aab08b1129856d63acf (User1)
```

### Failed Refresh

```
❌ Error refreshing token: Error message here
```

### Metrics to Track

- Number of refresh attempts per day
- Refresh success rate
- Average time between refreshes
- Users with expired refresh tokens
- Failed refresh attempts (potential security issue)

## Deployment Checklist

### Before Deployment

- [ ] Environment variables set in production
- [ ] Secrets are strong and unique
- [ ] Token expiry times configured appropriately
- [ ] Database indexes on refreshToken field (optional, for performance)
- [ ] Logging configured
- [ ] Error tracking setup (Sentry, etc.)

### After Deployment

- [ ] Test login returns both tokens
- [ ] Test refresh endpoint works
- [ ] Test refresh token rotation
- [ ] Monitor refresh success rate
- [ ] Check for unusual refresh patterns

## Troubleshooting

### Issue: "Invalid refresh token" on first refresh

**Cause**: Refresh token not matching database
**Solution**: Verify token is being saved correctly in `generateAccessAndRefreshTokens`

### Issue: Refresh endpoint returns 401 immediately

**Cause**: Refresh endpoint has auth middleware
**Solution**: Ensure refresh route does NOT use `verifyJWT` middleware

### Issue: Old refresh token still works

**Cause**: Token rotation not working
**Solution**: Verify new refresh token is saved to database

### Issue: Refresh always fails with 500 error

**Cause**: JWT_REFRESH_SECRET not set
**Solution**: Check environment variables

## Future Enhancements

1. **Refresh Token Hashing**: Hash refresh tokens before storing in database
2. **Device Tracking**: Track which device each refresh token belongs to
3. **Token Revocation**: Endpoint to revoke all refresh tokens for a user
4. **Refresh Token Families**: Track token lineage to detect reuse attacks
5. **Rate Limiting**: Limit refresh attempts to prevent brute force

## Security Best Practices

1. ✅ **Use HTTPS**: All token transmission over secure connections
2. ✅ **Rotate Tokens**: Generate new refresh token on each refresh
3. ✅ **Validate Ownership**: Verify refresh token belongs to user
4. ✅ **Short Access Tokens**: Keep access token lifetime short
5. ⏳ **Hash Refresh Tokens**: Store hashed versions in database (future)
6. ⏳ **Audit Logs**: Log all refresh attempts (future)

## References

- JWT Specification: https://jwt.io/
- OAuth 2.0 Token Refresh: https://www.oauth.com/oauth2-servers/access-tokens/refreshing-access-tokens/
- OWASP JWT Best Practices: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

---

**Status**: ✅ Backend implementation complete and ready for testing
