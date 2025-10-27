import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { ListenerStats } from "./models/listenerStat.model.js";
import { Message } from "./models/message.model.js";
import { Profile } from "./models/profile.model.js";
import { Session } from "./models/session.model.js";
import { User } from "./models/user.model.js";
import { UserStats } from "./models/userStats.model.js";
import { Appointment } from "./models/appointment.model.js";
import { processSessionPayment } from "./controllers/appointment.controller.js";

let io;
const userSockets = new Map(); // Map userId to socketId
const activeSessions = new Map(); // Map roomId to session data
const disconnectTimers = new Map(); // Map userId to disconnect timer (30-second grace period)

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

    // Clear any pending disconnect timer for this user
    if (disconnectTimers.has(userId.toString())) {
      clearTimeout(disconnectTimers.get(userId.toString()));
      disconnectTimers.delete(userId.toString());
      console.log(`⏰ Cancelled disconnect timer for ${userId}`);
    }

    // Handle joining a chat room
    socket.on("join_room", async (data) => {
      try {
        const { otherUserId, appointmentId } = data;
        const currentUserId = userId;

        console.log(`🚪 User ${currentUserId} joining room with ${otherUserId}, appointmentId: ${appointmentId}`);

        // If appointmentId is provided, validate the appointment
        let validatedAppointment = null;
        if (appointmentId) {
          validatedAppointment = await validateAppointment(appointmentId, currentUserId, otherUserId);
          
          if (!validatedAppointment.valid) {
            socket.emit("error", { message: validatedAppointment.message });
            return;
          }
        } else {
          // Without appointment, verify they are matched
          const isMatched = await verifyMatch(currentUserId, otherUserId);
          if (!isMatched) {
            socket.emit("error", { message: "You are not matched with this user" });
            return;
          }
        }

        // Get both users to determine who is listener
        const currentUser = await User.findById(currentUserId);
        const otherUser = await User.findById(otherUserId);

        // Create room ID (consistent ordering)
        const roomId = [currentUserId, otherUserId].sort().join("_");
        socket.join(roomId);

        console.log(`✅ User ${currentUserId} joined room ${roomId}`);

        // Check if there's already an active session for this room
        let sessionData = activeSessions.get(roomId);
        
        if (!sessionData) {
          // Determine listener and user
          let listenerId, regularUserId;
          if (currentUser.userType === "Listener") {
            listenerId = currentUserId;
            regularUserId = otherUserId;
          } else if (otherUser.userType === "Listener") {
            listenerId = otherUserId;
            regularUserId = currentUserId;
          }

          // Only create session if there's a listener involved
          if (listenerId) {
            // Create new session in database
            const session = await Session.create({
              userId: regularUserId,
              listenerId: listenerId,
              roomId: roomId,
              startTime: new Date(),
              status: "active",
            });

            // Update appointment if provided
            if (validatedAppointment && validatedAppointment.appointment) {
              const appointment = validatedAppointment.appointment;
              appointment.sessionId = session._id;
              appointment.sessionStartedAt = new Date();
              await appointment.save();
            }

            sessionData = {
              sessionId: session._id,
              userId: regularUserId,
              listenerId: listenerId,
              startTime: new Date(),
              participants: new Set([currentUserId.toString()]),
              appointmentId: appointmentId || null,
              timerInterval: null, // Will hold the interval for broadcasting time updates
            };

            activeSessions.set(roomId, sessionData);
            console.log(`📊 Created new session ${session._id} for room ${roomId}`);

            // Start broadcasting timer updates to both participants
            startSessionTimer(roomId, sessionData);
          }
        } else {
          // Add current user to participants
          sessionData.participants.add(currentUserId.toString());
          console.log(`📊 User added to existing session for room ${roomId}`);
        }

        socket.emit("room_joined", { 
          roomId, 
          sessionId: sessionData?.sessionId,
          appointmentId: sessionData?.appointmentId,
          startTime: sessionData?.startTime,
        });
      } catch (error) {
        console.error("❌ Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Handle leaving a chat room (when user navigates away)
    socket.on("leave_room", async (data) => {
      try {
        const { otherUserId } = data;
        const currentUserId = userId;
        const roomId = [currentUserId.toString(), otherUserId].sort().join("_");

        console.log(`🚪 User ${currentUserId} leaving room ${roomId}`);
        
        socket.leave(roomId);

        // Check if there's an active session for this room
        const sessionData = activeSessions.get(roomId);
        
        if (sessionData) {
          console.log(`📊 Found active session for room ${roomId}`);
          sessionData.participants.delete(currentUserId.toString());
          
          console.log(`📊 Remaining participants: ${sessionData.participants.size}`);
          
          // End session immediately when user explicitly leaves
          console.log(`🏁 User left room, ending session for ${roomId}`);
          await endSession(roomId, sessionData, "completed");
        }
      } catch (error) {
        console.error("❌ Error leaving room:", error);
      }
    });

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

        // Check if sender is a Listener and update stats
        const senderUser = await User.findById(senderId);
        if (senderUser && senderUser.userType === "Listener") {
          let listenerStats = await ListenerStats.findOne({ userId: senderId });
          
          // Create stats if they don't exist
          if (!listenerStats) {
            listenerStats = await ListenerStats.create({ userId: senderId });
            console.log(`✅ [Socket] Created new ListenerStats for ${senderId}`);
          }
          
          // Check if this user is already in the uniqueUsersListenedTo array
          const alreadyListened = listenerStats.uniqueUsersListenedTo.some(
            (userId) => userId.toString() === receiverId.toString()
          );

          if (!alreadyListened) {
            // This is the first message to this user, add them to the array
            listenerStats.uniqueUsersListenedTo.push(receiverId);
            await listenerStats.save();
            console.log(`✅ [Socket] Listener ${senderId} now listening to ${listenerStats.uniqueUsersListenedTo.length} unique users`);
          }
        }

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
      const disconnectedUserId = userId.toString();
      
      console.log(`⚠️ User ${disconnectedUserId} disconnecting...`);
      console.log(`📊 Active sessions before cleanup:`, activeSessions.size);
      
      // Set a 30-second grace period before ending sessions
      const timer = setTimeout(async () => {
        try {
          userSockets.delete(disconnectedUserId);
          console.log(`❌ User disconnected (grace period expired): ${disconnectedUserId}`);
          console.log(`👥 Total connected users: ${userSockets.size}`);

          // Find all active sessions involving this user
          for (const [roomId, sessionData] of activeSessions.entries()) {
            console.log(`🔍 Checking session in room ${roomId}, participants:`, Array.from(sessionData.participants));
            
            if (sessionData.participants.has(disconnectedUserId)) {
              console.log(`✅ Found session involving ${disconnectedUserId} in room ${roomId}`);
              sessionData.participants.delete(disconnectedUserId);
              
              console.log(`📊 Remaining participants in room ${roomId}:`, sessionData.participants.size);
              
              // End the session when ANY user disconnects (not waiting for both)
              // We can optionally check if both are gone, but for now end on first disconnect
              console.log(`🏁 Ending session for room ${roomId} due to user disconnect`);
              await endSession(roomId, sessionData, "completed");
            }
          }
          
          console.log(`📊 Active sessions after cleanup:`, activeSessions.size);
        } catch (error) {
          console.error("❌ Error handling disconnect:", error);
        }
      }, 30000); // 30-second grace period

      disconnectTimers.set(disconnectedUserId, timer);
      console.log(`⏰ Started 30-second grace period timer for ${disconnectedUserId}`);
    });
  });

  return io;
};

// Helper function to end a session and update stats
const endSession = async (roomId, sessionData, status = "completed") => {
  try {
    const { sessionId, userId, listenerId, startTime, appointmentId } = sessionData;
    
    const endTime = new Date();
    const durationInSeconds = Math.floor((endTime - startTime) / 1000);

    console.log(`⏱️ Ending session ${sessionId} - Duration: ${durationInSeconds}s`);

    // Stop the timer broadcast
    stopSessionTimer(sessionData);

    // First, check if session has already been updated (get current state BEFORE updating)
    const currentSession = await Session.findById(sessionId);
    
    if (!currentSession) {
      console.error(`❌ Session ${sessionId} not found`);
      return;
    }

    // Check if stats were already updated for this session
    if (currentSession.statsUpdated) {
      console.log(`⚠️ Session ${sessionId} stats already updated, skipping...`);
      return;
    }

    // Update session in database
    await Session.findByIdAndUpdate(
      sessionId,
      {
        endTime,
        durationInSeconds,
        status,
        statsUpdated: true,
      },
      { new: true }
    );

    console.log(`💾 Session ${sessionId} updated in DB with duration: ${durationInSeconds}s`);

    // Process payment if appointment exists
    let amountCharged = 0;
    if (appointmentId) {
      const paymentResult = await processSessionPayment(appointmentId, durationInSeconds);
      if (paymentResult) {
        amountCharged = paymentResult.amountCharged;
        console.log(`💰 Payment processed: ₹${amountCharged} deducted from user, added to listener`);
      }
    }

    // Update listener stats
    let listenerStats = await ListenerStats.findOne({ userId: listenerId });
    if (!listenerStats) {
      listenerStats = await ListenerStats.create({ userId: listenerId });
      console.log(`✅ Created new ListenerStats for ${listenerId}`);
    }

    // Add user to uniqueUsersListenedTo if not already there
    const alreadyListened = listenerStats.uniqueUsersListenedTo.some(
      (uid) => uid.toString() === userId.toString()
    );

    const updateData = {
      $inc: {
        sessionsConducted: 1,
        totalChatTime: durationInSeconds,
      },
    };

    if (!alreadyListened) {
      updateData.$addToSet = { uniqueUsersListenedTo: userId };
    }

    const updatedListenerStats = await ListenerStats.findByIdAndUpdate(
      listenerStats._id, 
      updateData,
      { new: true }
    );

    console.log(`📊 Listener stats updated: sessionsConducted=${updatedListenerStats.sessionsConducted}, totalChatTime=${updatedListenerStats.totalChatTime}s`);

    // Update user stats
    let userStats = await UserStats.findOne({ userId });
    if (!userStats) {
      userStats = await UserStats.create({ userId });
      console.log(`✅ Created new UserStats for ${userId}`);
    }

    const updatedUserStats = await UserStats.findByIdAndUpdate(
      userStats._id,
      {
        $inc: {
          sessionsCompleted: 1,
          totalSessionTime: durationInSeconds,
        },
      },
      { new: true }
    );

    console.log(`📊 User stats updated: sessionsCompleted=${updatedUserStats.sessionsCompleted}, totalSessionTime=${updatedUserStats.totalSessionTime}s`);
    console.log(`✅ Stats successfully updated - Listener: ${listenerId}, User: ${userId}, Duration: ${durationInSeconds}s`);

    // Emit session_ended event to both parties
    const userSocketId = userSockets.get(userId.toString());
    const listenerSocketId = userSockets.get(listenerId.toString());

    const sessionEndData = {
      sessionId,
      durationInSeconds,
      roomId,
      endTime,
      amountCharged,
      appointmentId,
    };

    if (userSocketId) {
      io.to(userSocketId).emit("session_ended", {
        ...sessionEndData,
        requestRating: true, // Prompt user to rate the listener
      });
    }

    if (listenerSocketId) {
      io.to(listenerSocketId).emit("session_ended", sessionEndData);
    }

    // Remove from active sessions
    activeSessions.delete(roomId);
    console.log(`🗑️ Session ${sessionId} removed from active sessions`);
  } catch (error) {
    console.error("❌ Error ending session:", error);
  }
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


  const isMatched = !!(user1AcceptedUser2 && user2AcceptedUser1);

  if (!isMatched) {
    const allAccepted = await Profile.find({ Status: "accepted" }).select(
      "userId otherUserId Status"
    );
    allAccepted.forEach((p, i) => {
    });
  }

  return isMatched;
};

// Helper function to validate appointment before joining session
const validateAppointment = async (appointmentId, currentUserId, otherUserId) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return { valid: false, message: "Appointment not found" };
    }

    // Check if user is part of this appointment
    const isParticipant = 
      appointment.userId.toString() === currentUserId.toString() ||
      appointment.listenerId.toString() === currentUserId.toString();

    if (!isParticipant) {
      return { valid: false, message: "You are not part of this appointment" };
    }

    // Check if appointment is accepted
    if (appointment.status !== "accepted") {
      return { valid: false, message: `Appointment is ${appointment.status}, not accepted` };
    }

    // Check if appointment time has arrived (allow joining 5 minutes before)
    const appointmentDateTime = new Date(appointment.requestedDate);
    const [hours, minutes] = appointment.requestedTime.split(":");
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const now = new Date();
    const fiveMinutesBefore = new Date(appointmentDateTime.getTime() - 5 * 60 * 1000);
    
    if (now < fiveMinutesBefore) {
      return { 
        valid: false, 
        message: "Appointment time has not arrived yet. You can join 5 minutes before the scheduled time." 
      };
    }

    // Optional: Check if appointment is not too old (e.g., more than 2 hours past scheduled time)
    const twoHoursAfter = new Date(appointmentDateTime.getTime() + 2 * 60 * 60 * 1000);
    if (now > twoHoursAfter) {
      return { 
        valid: false, 
        message: "Appointment time has passed. Please schedule a new appointment." 
      };
    }

    return { valid: true, appointment };
  } catch (error) {
    console.error("Error validating appointment:", error);
    return { valid: false, message: "Error validating appointment" };
  }
};

// Helper function to start broadcasting timer updates
const startSessionTimer = (roomId, sessionData) => {
  // Clear any existing timer
  if (sessionData.timerInterval) {
    clearInterval(sessionData.timerInterval);
  }

  // Broadcast timer every second
  sessionData.timerInterval = setInterval(() => {
    const elapsedSeconds = Math.floor((new Date() - sessionData.startTime) / 1000);
    
    // Broadcast to all participants in the room
    io.to(roomId).emit("session_timer_update", {
      elapsedSeconds,
      sessionId: sessionData.sessionId,
      appointmentId: sessionData.appointmentId,
    });
  }, 1000);

  console.log(`⏱️ Started timer broadcast for room ${roomId}`);
};

// Helper function to stop session timer
const stopSessionTimer = (sessionData) => {
  if (sessionData.timerInterval) {
    clearInterval(sessionData.timerInterval);
    sessionData.timerInterval = null;
    console.log(`⏱️ Stopped timer broadcast`);
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
