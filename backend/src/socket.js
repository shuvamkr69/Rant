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

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.userId = decoded._id;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
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

        // Verify they are matched
        const isMatched = await verifyMatch(senderId, receiverId);
        if (!isMatched) {
          socket.emit("error", {
            message: "You are not matched with this user",
          });
          return;
        }

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

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
