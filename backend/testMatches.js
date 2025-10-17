// Test script to check for mutual matches in your database
// Run this with: node testMatches.js

import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import { Profile } from "./src/models/profile.model.js";
import { User } from "./src/models/user.model.js";

dotenv.config({ path: "../.env" });

const checkMatches = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    // Get all users
    const allUsers = await User.find().select("name _id");
    console.log(`📊 Total users: ${allUsers.length}\n`);

    // Get all profiles
    const allProfiles = await Profile.find().populate("userId otherUserId");
    console.log(`📊 Total profiles (swipes): ${allProfiles.length}\n`);

    // Show all profiles
    console.log("📋 All Profiles:");
    allProfiles.forEach((profile) => {
      console.log(
        `  - ${profile.userId?.name || profile.userId} ${
          profile.Status === "accepted" ? "❤️ liked" : "❌ rejected"
        } ${profile.otherUserId?.name || profile.otherUserId}`
      );
    });

    console.log("\n🔍 Checking for mutual matches...\n");

    // Check each user for matches
    for (const user of allUsers) {
      const myAccepted = await Profile.find({
        userId: user._id,
        Status: "accepted",
      }).select("otherUserId");

      const othersAcceptedMe = await Profile.find({
        otherUserId: user._id,
        Status: "accepted",
      }).select("userId");

      const myAcceptedIds = myAccepted.map((p) => p.otherUserId.toString());
      const othersAcceptedMeIds = othersAcceptedMe.map((p) =>
        p.userId.toString()
      );

      const mutualMatches = myAcceptedIds.filter((id) =>
        othersAcceptedMeIds.includes(id)
      );

      if (mutualMatches.length > 0) {
        console.log(
          `💝 ${user.name} has ${mutualMatches.length} mutual match(es):`
        );
        for (const matchId of mutualMatches) {
          const matchUser = await User.findById(matchId);
          console.log(`   ↔️  ${matchUser.name}`);
        }
      } else {
        console.log(`❌ ${user.name} has no mutual matches`);
      }
    }

    console.log("\n✅ Check complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkMatches();
