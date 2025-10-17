import dotenv from "dotenv";
import mongoose from "mongoose";
import { Profile } from "./src/models/profile.model.js";

dotenv.config({ path: "../.env" });

async function testMatchVerification() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all profiles
    const allProfiles = await Profile.find({}).populate("userId otherUserId");

    console.log("\n📊 All Profile Records:");
    console.log("========================");
    allProfiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. Profile ID: ${profile._id}`);
      console.log(`   User: ${profile.userId?.name} (${profile.userId?._id})`);
      console.log(
        `   Other User: ${profile.otherUserId?.name} (${profile.otherUserId?._id})`
      );
      console.log(`   Status: ${profile.Status}`);
      console.log(`   Pre-Match Message: ${profile.preMatchMessage || "None"}`);
    });

    // Find mutual matches
    console.log("\n\n🤝 Finding Mutual Matches:");
    console.log("========================");

    const acceptedProfiles = await Profile.find({
      Status: "accepted",
    }).populate("userId otherUserId");

    const mutualMatches = [];
    for (let profile of acceptedProfiles) {
      const reverseMatch = acceptedProfiles.find(
        (p) =>
          p.userId._id.toString() === profile.otherUserId._id.toString() &&
          p.otherUserId._id.toString() === profile.userId._id.toString()
      );

      if (reverseMatch) {
        const matchKey = [
          profile.userId._id.toString(),
          profile.otherUserId._id.toString(),
        ]
          .sort()
          .join("-");
        if (!mutualMatches.some((m) => m.key === matchKey)) {
          mutualMatches.push({
            key: matchKey,
            user1: profile.userId.name,
            user1Id: profile.userId._id,
            user2: profile.otherUserId.name,
            user2Id: profile.otherUserId._id,
            message1: profile.preMatchMessage,
            message2: reverseMatch.preMatchMessage,
          });
        }
      }
    }

    console.log(`\nFound ${mutualMatches.length} mutual matches:`);
    mutualMatches.forEach((match, index) => {
      console.log(`\n${index + 1}. ${match.user1} ↔ ${match.user2}`);
      console.log(`   User1 ID: ${match.user1Id}`);
      console.log(`   User2 ID: ${match.user2Id}`);
      console.log(
        `   Message from ${match.user1}: ${match.message1 || "None"}`
      );
      console.log(
        `   Message from ${match.user2}: ${match.message2 || "None"}`
      );
    });

    await mongoose.connection.close();
    console.log("\n✅ Test complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testMatchVerification();
