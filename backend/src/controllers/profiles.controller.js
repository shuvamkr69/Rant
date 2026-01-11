import { ListenerStats } from "../models/listenerStat.model.js";
import { Profile } from "../models/profile.model.js";
import { User } from "../models/user.model.js";
import { sendPushNotification } from "../utils/pushNotification.js";

export const fetchProfiles = async (req, res) => {
  const ownUserId = req.user._id;
  const currentUser = req.user;
  const currentUserType = currentUser.userType;
  const targetUserType = currentUserType === "User" ? "Listener" : "User";
  const interactedProfiles = await Profile.find({ userId: ownUserId }).select(
    "otherUserId"
  );
  const interactedUserIds = interactedProfiles.map(
    (profile) => profile.otherUserId
  );

  let profiles;

  if (currentUserType === "User") {
    profiles = await User.find({
      _id: {
        $nin: [...interactedUserIds, ownUserId],
      },
      userType: targetUserType,
    })
      .select(
        "-refreshToken -__v -createdAt -updatedAt -mobileNumber -password"
      )
      .lean(); // Use lean() for better performance

    // Attach listener stats for Listener profiles
    for (let profile of profiles) {
      if (profile.userType === "Listener") {
        const listenerStats = await ListenerStats.findOne({
          userId: profile._id,
        })
          .select("averageRating totalRatings sessionsConducted")
          .lean();

        if (listenerStats) {
          profile.listenerStats = {
            averageRating: listenerStats.averageRating || 0,
            totalRatings: listenerStats.totalRatings || 0,
            sessionsConducted: listenerStats.sessionsConducted || 0,
          };
        } else {
          // Default stats for new listeners
          profile.listenerStats = {
            averageRating: 0,
            totalRatings: 0,
            sessionsConducted: 0,
          };
        }
      }
    }
  } else if (currentUserType === "Listener") {
    const usersWhoAcceptedMe = await Profile.find({
      otherUserId: ownUserId,
      Status: "accepted",
    }).select("userId");

    const userIdsWhoAcceptedMe = usersWhoAcceptedMe.map(
      (profile) => profile.userId
    );

    console.log(
      "🎯 Users who accepted this Listener:",
      userIdsWhoAcceptedMe.length
    );

    // Now filter: show only those Users, excluding ones the Listener already interacted with
    profiles = await User.find({
      _id: {
        $in: userIdsWhoAcceptedMe, // Must be in the list of users who accepted
        $nin: interactedUserIds, // Exclude ones already interacted with
      },
      userType: targetUserType, // "User"
    })
      .select("-refreshToken -__v -createdAt -updatedAt -mobileNumber")
      .lean(); // Use lean() to get plain objects

    // Attach pre-match messages to each profile
    for (let profile of profiles) {
      const profileRecord = await Profile.findOne({
        userId: profile._id,
        otherUserId: ownUserId,
        Status: "accepted",
      });
      if (profileRecord && profileRecord.preMatchMessage) {
        profile.preMatchMessage = profileRecord.preMatchMessage;
        console.log(
          `📬 Attached pre-match message from ${profile.name}:`,
          profileRecord.preMatchMessage
        );
      }
    }
  }

  res.status(200).send(profiles);
};

export const fetchMyProfile = async (req, res) => {
  const ownUserId = req.user._id;
  const myProfile = await User.findById(ownUserId).select(
    "-refreshToken -__v -createdAt -updatedAt -mobileNumber"
  );
  res.status(200).send(myProfile);
};

export const debugAllProfiles = async (req, res) => {
  try {
    const allProfiles = await Profile.find({})
      .populate("userId", "name userType")
      .populate("otherUserId", "name userType");

    const formattedProfiles = allProfiles.map((p) => ({
      _id: p._id.toString(),
      from: p.userId?.name || "Unknown",
      fromId: p.userId?._id.toString(),
      fromType: p.userId?.userType,
      to: p.otherUserId?.name || "Unknown",
      toId: p.otherUserId?._id.toString(),
      toType: p.otherUserId?.userType,
      status: p.Status,
      message: p.preMatchMessage || null,
      createdAt: p.createdAt,
    }));

    // Find mutual matches
    const mutualMatches = [];
    for (let profile of allProfiles) {
      if (profile.Status !== "accepted") continue;

      const reverseMatch = allProfiles.find(
        (p) =>
          p.Status === "accepted" &&
          p.userId?._id.toString() === profile.otherUserId?._id.toString() &&
          p.otherUserId?._id.toString() === profile.userId?._id.toString()
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
            user1Id: profile.userId._id.toString(),
            user2: profile.otherUserId.name,
            user2Id: profile.otherUserId._id.toString(),
          });
        }
      }
    }

    res.status(200).json({
      totalProfiles: allProfiles.length,
      profiles: formattedProfiles,
      mutualMatches: mutualMatches,
      mutualMatchCount: mutualMatches.length,
    });
  } catch (error) {
    console.error("❌ Error in debugAllProfiles:", error);
    res.status(500).json({ error: error.message });
  }
};

export const acceptProfile = async (req, res) => {
  try {
    const { otherUserId, preMatchMessage } = req.body;
    console.log("🔵 Accept request - otherUserId:", otherUserId);
    console.log("💬 Pre-match message:", preMatchMessage);

    const findId = await User.findById(otherUserId);
    if (!findId) {
      return res.status(404).json({ message: "User not found" });
    }

    const ownUserId = req.user._id;
    const currentUser = req.user;
    console.log("🔵 Current userId:", ownUserId);
    console.log("🔵 Current userType:", currentUser.userType);

    // Only allow pre-match messages if User is swiping on Listener
    let messageToStore = null;
    if (currentUser.userType === "User" && findId.userType === "Listener") {
      messageToStore = preMatchMessage || null;
      console.log("✅ User to Listener swipe - Pre-match message allowed");
    }

    const newProfile = await Profile.create({
      userId: ownUserId,
      otherUserId: otherUserId,
      Status: "accepted",
      preMatchMessage: messageToStore,
    });

    console.log("✅ Profile record created:", newProfile);

    // Check for mutual match
    const reverseProfile = await Profile.findOne({
      userId: otherUserId,
      otherUserId: ownUserId,
      Status: "accepted",
    });

    if (reverseProfile) {
      console.log("🎉 Mutual match detected!");

      // Send notification to User if Listener accepted
      if (currentUser.userType === "Listener" && findId.userType === "User") {
        await sendPushNotification(
          otherUserId,
          "Listener Matched 🎧",
          "A listener has accepted your invite. You can start chatting now!"
        );
      }
    }

    res.status(200).json({ message: "Profile accepted", profile: newProfile });
  } catch (error) {
    console.error("❌ Error in acceptProfile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const rejectProfile = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    console.log("🔵 Reject request - otherUserId:", otherUserId);

    const findId = await User.findById(otherUserId);
    if (!findId) {
      return res.status(404).json({ message: "User not found" });
    }

    const ownUserId = req.user._id;
    console.log("🔵 Current userId:", ownUserId);

    const newProfile = await Profile.create({
      userId: ownUserId,
      otherUserId: otherUserId,
      Status: "rejected",
    });

    console.log("✅ Profile record created:", newProfile);
    res.status(200).json({ message: "Profile rejected", profile: newProfile });
  } catch (error) {
    console.error("❌ Error in rejectProfile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
