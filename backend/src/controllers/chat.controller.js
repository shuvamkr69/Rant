import { ListenerStats } from "../models/listenerStat.model.js";
import { Message } from "../models/message.model.js";
import { Profile } from "../models/profile.model.js";
import { User } from "../models/user.model.js";

export const getMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("🔍 Fetching matches for user:", userId);

    // Get the current user's blocked list
    const currentUser = await User.findById(userId).select("blockedUsers");
    const blockedByMe =
      currentUser?.blockedUsers?.map((id) => id.toString()) || [];

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
        (otherId) => otherId.toString() === id.toString(),
      ),
    );

    const matches = await User.find({
      _id: {
        $in: mutualMatchIds,
        // Exclude anyone the current user has blocked, and anyone who has blocked the current user
        $nin: blockedByMe,
      },
      // Also exclude users who have blocked the current user
      blockedUsers: { $nin: [userId] },
    }).select("-refreshToken -__v -mobileNumber -blockedUsers");
    res.status(200).json({ matches });
  } catch (error) {
    console.error("❌ Error fetching matches:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUser = req.user;
    const { otherUserId } = req.params;

    console.log("💬 Fetching chat history:", userId, "<->", otherUserId);

    const isMatched = await verifyMatch(userId, otherUserId);

    // Special case: User swiped right on Listener but Listener hasn't accepted yet
    if (!isMatched) {
      // Check if current user is a "User" who has accepted the "Listener"
      const userAcceptedListener = await Profile.findOne({
        userId: userId,
        otherUserId: otherUserId,
        Status: "accepted",
      });

      if (currentUser.userType === "User" && userAcceptedListener) {
        // User has swiped right on Listener, but no mutual match yet
        console.log("⏳ User waiting for Listener to accept");
        return res.status(200).json({
          messages: [],
          isPending: true,
          message: "The listener has not yet accepted the chat invite",
        });
      }

      // Otherwise, no relationship at all
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
      { isRead: true },
    );

    res.status(200).json({ messages, isPending: false });
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const senderUser = req.user; // This contains the full user object from auth middleware
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

    // If sender is a Listener, check if this is their first message to this user
    if (senderUser.userType === "Listener") {
      let listenerStats = await ListenerStats.findOne({ userId: senderId });

      // Create stats if they don't exist
      if (!listenerStats) {
        listenerStats = await ListenerStats.create({ userId: senderId });
      }

      // Check if this user is already in the uniqueUsersListenedTo array
      const alreadyListened = listenerStats.uniqueUsersListenedTo.some(
        (userId) => userId.toString() === receiverId.toString(),
      );

      if (!alreadyListened) {
        // This is the first message to this user, add them to the array
        listenerStats.uniqueUsersListenedTo.push(receiverId);
        await listenerStats.save();
        console.log(
          `✅ Listener ${senderId} now listening to ${listenerStats.uniqueUsersListenedTo.length} unique users`,
        );
      }
    }

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

  return !!(user1AcceptedUser2 && user2AcceptedUser1);
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
