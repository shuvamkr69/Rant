import { Profile } from "../models/profile.model.js";
import { User } from "../models/user.model.js";

export const fetchProfiles = async (req, res) => {
  const ownUserId = req.user._id;
  const currentUser = req.user;
  const currentUserType = currentUser.userType;
  console.log("🔍 Current user type:", currentUserType);

  const targetUserType = currentUserType === "User" ? "Listener" : "User";
  console.log("🎯 Target user type to fetch:", targetUserType);

  const interactedProfiles = await Profile.find({ userId: ownUserId }).select(
    "otherUserId"
  );
  const interactedUserIds = interactedProfiles.map(
    (profile) => profile.otherUserId
  );

  const profiles = await User.find({
    _id: {
      $nin: [...interactedUserIds, ownUserId],
    },
    userType: targetUserType,
  }).select("-refreshToken -__v -createdAt -updatedAt -mobileNumber");

  console.log("Profiles found:", profiles.length);
  res.status(200).send(profiles);
};

export const fetchMyProfile = async (req, res) => {
  const ownUserId = req.user._id;
  const myProfile = await User.findById(ownUserId).select(
    "-refreshToken -__v -createdAt -updatedAt -mobileNumber"
  );
  res.status(200).send(myProfile);
};

export const acceptProfile = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    console.log("🔵 Accept request - otherUserId:", otherUserId);

    const findId = await User.findById(otherUserId);
    if (!findId) {
      return res.status(404).json({ message: "User not found" });
    }

    const ownUserId = req.user._id;
    console.log("🔵 Current userId:", ownUserId);

    const newProfile = await Profile.create({
      userId: ownUserId,
      otherUserId: otherUserId,
      Status: "accepted",
    });

    console.log("✅ Profile record created:", newProfile);
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
