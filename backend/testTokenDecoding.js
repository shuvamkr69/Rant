import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

// Test token decoding
const testToken = process.argv[2];

if (!testToken) {
  console.log("Usage: node testTokenDecoding.js <token>");
  console.log(
    "Example: node testTokenDecoding.js eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  );
  process.exit(1);
}

try {
  console.log("\n🔐 Testing Token Decoding");
  console.log("=".repeat(50));

  console.log(
    "\n📋 Token (first 50 chars):",
    testToken.substring(0, 50) + "..."
  );

  const decoded = jwt.verify(testToken, process.env.ACCESS_TOKEN_SECRET);

  console.log("\n✅ Token is valid!");
  console.log("\n📊 Decoded Payload:");
  console.log(JSON.stringify(decoded, null, 2));

  console.log("\n👤 User ID:", decoded._id);
  console.log("📧 Email:", decoded.email || "N/A");
  console.log("👥 Full Name:", decoded.fullName || "N/A");

  if (decoded.exp) {
    const expiryDate = new Date(decoded.exp * 1000);
    const now = new Date();
    const isExpired = now > expiryDate;

    console.log("\n⏰ Expiry:", expiryDate.toLocaleString());
    console.log("⏱️  Status:", isExpired ? "❌ EXPIRED" : "✅ VALID");

    if (!isExpired) {
      const timeLeft = Math.floor((expiryDate - now) / 1000 / 60);
      console.log("⏳ Time left:", timeLeft, "minutes");
    }
  }

  console.log("\n" + "=".repeat(50));
} catch (error) {
  console.error("\n❌ Token Verification Failed!");
  console.error("Error:", error.message);

  if (error.name === "TokenExpiredError") {
    console.log("\n⏰ Token has expired");
  } else if (error.name === "JsonWebTokenError") {
    console.log("\n🔑 Invalid token format or secret");
  }

  process.exit(1);
}
