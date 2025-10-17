import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { Message } from "./models/message.model.js";
import { Profile } from "./models/profile.model.js";

let io;
const userSockets = new Map(); // Map userId to socketId

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Configure this properly in production
      methods: ["GET", "POST"],
    },
  });

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      console.log(
        "🔐 Socket auth - Token (first 20 chars):",
        token.substring(0, 20) + "..."
      );

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log("🔓 Socket auth - Decoded user ID:", decoded._id);
      console.log("🔓 Socket auth - Full decoded:", decoded);

      socket.userId = decoded._id;
      next();
    } catch (error) {
      console.error("❌ Socket authentication error:", error.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    userSockets.set(userId.toString(), socket.id);

    console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`);
    console.log(`👥 Total connected users: ${userSockets.size}`);

    // Join user to their personal room
    socket.join(userId.toString());

    // Handle sending messages
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, message } = data;
        const senderId = userId;

        console.log(`💬 Message from ${senderId} to ${receiverId}:`, message);
        console.log(`📊 SenderId type:`, typeof senderId, senderId);
        console.log(`📊 ReceiverId type:`, typeof receiverId, receiverId);

        // Verify they are matched - pass IDs as-is, verifyMatch will handle conversion
        const isMatched = await verifyMatch(senderId, receiverId);
        if (!isMatched) {
          console.log("❌ Match verification failed!");
          socket.emit("error", {
            message: "You are not matched with this user",
          });
          return;
        }

        console.log("✅ Match verified, saving message...");

        // Save message to database
        const newMessage = await Message.create({
          senderId,
          receiverId,
          message: message.trim(),
        });

        const populatedMessage = await Message.findById(newMessage._id)
          .populate("senderId", "name userType")
          .populate("receiverId", "name userType");

        // Send to sender (confirmation)
        socket.emit("message_sent", populatedMessage);

        // Send to receiver if they're online
        const receiverSocketId = userSockets.get(receiverId.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", populatedMessage);
          console.log(`✅ Message delivered to ${receiverId}`);
        } else {
          console.log(`⚠️ Receiver ${receiverId} is offline`);
        }
      } catch (error) {
        console.error("❌ Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { receiverId } = data;
      const receiverSocketId = userSockets.get(receiverId.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", {
          userId: userId.toString(),
        });
      }
    });

    // Handle stop typing indicator
    socket.on("stop_typing", (data) => {
      const { receiverId } = data;
      const receiverSocketId = userSockets.get(receiverId.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_stop_typing", {
          userId: userId.toString(),
        });
      }
    });

    // Handle message read receipt
    socket.on("mark_read", async (data) => {
      try {
        const { messageIds } = data;
        await Message.updateMany(
          { _id: { $in: messageIds }, receiverId: userId },
          { isRead: true }
        );

        console.log(`✅ Marked ${messageIds.length} messages as read`);
      } catch (error) {
        console.error("❌ Error marking messages as read:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      userSockets.delete(userId.toString());
      console.log(`❌ User disconnected: ${userId}`);
      console.log(`👥 Total connected users: ${userSockets.size}`);
    });
  });

  return io;
};

// Helper function to verify if two users are matched
const verifyMatch = async (userId1, userId2) => {
  console.log("🔍 Verifying match between:", userId1, "and", userId2);
  console.log("🔍 userId1 type:", typeof userId1);
  console.log("🔍 userId2 type:", typeof userId2);

  // Normalize IDs - convert to string for consistent comparison
  const id1String = userId1.toString();
  const id2String = userId2.toString();

  console.log("🔍 Normalized id1:", id1String);
  console.log("🔍 Normalized id2:", id2String);

  // Query using the original values (Mongoose handles ObjectId conversion)
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

  console.log("🔍 User1 accepted User2:", !!user1AcceptedUser2);
  if (user1AcceptedUser2) {
    console.log("   ✓ Found record:", {
      _id: user1AcceptedUser2._id,
      userId: user1AcceptedUser2.userId.toString(),
      otherUserId: user1AcceptedUser2.otherUserId.toString(),
      Status: user1AcceptedUser2.Status,
    });
  }

  console.log("🔍 User2 accepted User1:", !!user2AcceptedUser1);
  if (user2AcceptedUser1) {
    console.log("   ✓ Found record:", {
      _id: user2AcceptedUser1._id,
      userId: user2AcceptedUser1.userId.toString(),
      otherUserId: user2AcceptedUser1.otherUserId.toString(),
      Status: user2AcceptedUser1.Status,
    });
  }

  const isMatched = !!(user1AcceptedUser2 && user2AcceptedUser1);
  console.log("🔍 Final match result:", isMatched);

  // If not matched, dump all profiles for debugging
  if (!isMatched) {
    console.log("⚠️ Match failed! Dumping all accepted profiles:");
    const allAccepted = await Profile.find({ Status: "accepted" }).select(
      "userId otherUserId Status"
    );
    allAccepted.forEach((p, i) => {
      console.log(
        `   ${i + 1}. userId: ${p.userId} -> otherUserId: ${
          p.otherUserId
        } (Status: ${p.Status})`
      );
    });
  }

  return isMatched;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
