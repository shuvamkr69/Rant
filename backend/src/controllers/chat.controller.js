import { Message } from "../models/message.model.js";
import { Profile } from "../models/profile.model.js";
import { User } from "../models/user.model.js";

export const getMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("🔍 Fetching matches for user:", userId);

    const myAcceptedProfiles = await Profile.find({
      userId: userId,
      Status: "accepted",
    }).select("otherUserId");

    const myAcceptedUserIds = myAcceptedProfiles.map((p) => p.otherUserId);

    const othersAcceptedMe = await Profile.find({
      otherUserId: userId,
      Status: "accepted",
    }).select("userId");

    const othersAcceptedMeIds = othersAcceptedMe.map((p) => p.userId);

    const mutualMatchIds = myAcceptedUserIds.filter((id) =>
      othersAcceptedMeIds.some(
        (otherId) => otherId.toString() === id.toString()
      )
    );

    const matches = await User.find({
      _id: { $in: mutualMatchIds },
    }).select("-refreshToken -__v -mobileNumber");
    res.status(200).json({ matches });
  } catch (error) {
    console.error("❌ Error fetching matches:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId } = req.params;

    console.log("💬 Fetching chat history:", userId, "<->", otherUserId);

    const isMatched = await verifyMatch(userId, otherUserId);
    if (!isMatched) {
      return res
        .status(403)
        .json({ message: "You are not matched with this user" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 }) // Oldest first
      .populate("senderId", "name userType")
      .populate("receiverId", "name userType");

    // Mark messages as read
    await Message.updateMany(
      { senderId: otherUserId, receiverId: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const isMatched = await verifyMatch(senderId, receiverId);
    if (!isMatched) {
      return res
        .status(403)
        .json({ message: "You are not matched with this user" });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message: message.trim(),
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "name userType")
      .populate("receiverId", "name userType");

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyMatch = async (userId1, userId2) => {
  const user1AcceptedUser2 = await Profile.findOne({
    userId: userId1,
    otherUserId: userId2,
    Status: "accepted",
  });

  const user2AcceptedUser1 = await Profile.findOne({
    userId: userId2,
    otherUserId: userId1,
    Status: "accepted",
  });

  return user1AcceptedUser2 && user2AcceptedUser1;
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("❌ Error fetching unread count:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
