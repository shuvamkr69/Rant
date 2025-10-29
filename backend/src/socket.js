import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { ListenerStats } from "./models/listenerStat.model.js";
import { Message } from "./models/message.model.js";
import { Profile } from "./models/profile.model.js";
import { Session } from "./models/session.model.js";
import { User } from "./models/user.model.js";
import { UserStats } from "./models/userStats.model.js";

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
        const { otherUserId } = data;
        const currentUserId = userId;

        console.log(
          `🚪 User ${currentUserId} joining room with ${otherUserId}`
        );

        // Verify they are matched
        const isMatched = await verifyMatch(currentUserId, otherUserId);
        if (!isMatched) {
          socket.emit("error", {
            message: "You are not matched with this user",
          });
          return;
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

          // Only create session metadata if there's a listener involved
          // But DON'T start the timer yet - wait for both users
          if (listenerId) {
            sessionData = {
              sessionId: null, // Will be created when both users join
              userId: regularUserId,
              listenerId: listenerId,
              startTime: null, // Will be set when both users are present
              lastResumeTime: null,
              participants: new Set([currentUserId.toString()]),
              isPaused: false,
              totalPausedTime: 0,
              bothUsersPresent: false, // New flag to track both users
            };

            activeSessions.set(roomId, sessionData);
            console.log(
              `📊 Created session metadata for room ${roomId}, waiting for both users...`
            );
          }
        } else {
          // Add current user to participants
          sessionData.participants.add(currentUserId.toString());

          // Check if both users are now present
          if (
            sessionData.participants.size === 2 &&
            !sessionData.bothUsersPresent
          ) {
            // Both users are now in the chat - START THE SESSION!
            sessionData.bothUsersPresent = true;
            sessionData.startTime = new Date();
            sessionData.lastResumeTime = new Date();

            // Create session in database NOW
            const session = await Session.create({
              userId: sessionData.userId,
              listenerId: sessionData.listenerId,
              roomId: roomId,
              startTime: sessionData.startTime,
              status: "active",
              activeParticipants: Array.from(sessionData.participants),
            });

            sessionData.sessionId = session._id;
            console.log(
              `� BOTH USERS PRESENT! Session ${session._id} started for room ${roomId}`
            );

            // Notify both users that session has started
            io.to(roomId).emit("session_started", {
              sessionId: session._id,
              sessionStartTime: sessionData.startTime,
            });
          } else if (sessionData.isPaused && sessionData.bothUsersPresent) {
            // Resume session if it was paused (both users were present before)
            const now = new Date();
            const pauseDuration = Math.floor(
              (now - sessionData.pausedAt) / 1000
            );
            sessionData.totalPausedTime += pauseDuration;
            sessionData.lastResumeTime = now;
            sessionData.isPaused = false;

            // Update session in DB
            await Session.findByIdAndUpdate(sessionData.sessionId, {
              status: "active",
              activeParticipants: Array.from(sessionData.participants),
              totalPausedTime: sessionData.totalPausedTime,
            });

            console.log(
              `▶️ Session resumed for room ${roomId} after ${pauseDuration}s pause`
            );

            // Notify both users that session has resumed
            io.to(roomId).emit("session_resumed", {
              sessionId: sessionData.sessionId,
              sessionStartTime: sessionData.startTime,
            });
          }

          console.log(
            `📊 User added to session for room ${roomId}. Participants: ${sessionData.participants.size}/2`
          );
        }

        // Send room_joined confirmation with session status
        socket.emit("room_joined", {
          roomId,
          sessionId: sessionData?.sessionId,
          sessionStartTime: sessionData?.startTime,
          bothUsersPresent: sessionData?.bothUsersPresent || false,
          waitingForOtherUser: !sessionData?.bothUsersPresent,
        });

        // Check if the other user is a regular User and has exhausted their word limit
        if (otherUser.userType === "User") {
          const otherUserStats = await UserStats.findOne({
            userId: otherUserId,
          });
          if (otherUserStats) {
            // Check for monthly reset
            const now = new Date();
            const daysSinceReset = Math.floor(
              (now - new Date(otherUserStats.lastWordResetDate)) /
                (1000 * 60 * 60 * 24)
            );

            let wordsRemaining =
              otherUserStats.monthlyWordLimit -
              otherUserStats.wordsUsedThisMonth;

            // If reset needed, they have full limit
            if (daysSinceReset >= 30) {
              wordsRemaining = otherUserStats.monthlyWordLimit;
            }

            // If other user has no words left, notify current user (likely the Listener)
            if (wordsRemaining <= 0 && currentUser.userType === "Listener") {
              socket.emit("other_user_word_limit_exhausted", {
                userId: otherUserId,
                userName: otherUser.name,
                message: `${otherUser.name} has exhausted their monthly word limit.`,
              });
              console.log(
                `⚠️ Notified Listener ${currentUserId} that User ${otherUserId} has no words left`
              );
            }
          }
        }

        // Check if current user is a regular User and has exhausted their word limit
        if (currentUser.userType === "User") {
          const currentUserStats = await UserStats.findOne({
            userId: currentUserId,
          });
          if (currentUserStats) {
            // Check for monthly reset
            const now = new Date();
            const daysSinceReset = Math.floor(
              (now - new Date(currentUserStats.lastWordResetDate)) /
                (1000 * 60 * 60 * 24)
            );

            let wordsRemaining =
              currentUserStats.monthlyWordLimit -
              currentUserStats.wordsUsedThisMonth;

            // If reset needed, they have full limit
            if (daysSinceReset >= 30) {
              wordsRemaining = currentUserStats.monthlyWordLimit;
            }

            // If current user has no words left and other is a Listener, notify them
            if (wordsRemaining <= 0 && otherUser.userType === "Listener") {
              const otherSocketId = userSockets.get(otherUserId.toString());
              if (otherSocketId) {
                io.to(otherSocketId).emit("other_user_word_limit_exhausted", {
                  userId: currentUserId,
                  userName: currentUser.name,
                  message: `${currentUser.name} has exhausted their monthly word limit.`,
                });
                console.log(
                  `⚠️ Notified Listener ${otherUserId} that User ${currentUserId} has no words left`
                );
              }
            }
          }
        }
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

          console.log(
            `📊 Remaining participants: ${sessionData.participants.size}`
          );

          // Only pause/end if session was actually started (both users were present)
          if (sessionData.bothUsersPresent) {
            if (sessionData.participants.size === 0) {
              // Both users left - end the session
              console.log(
                `🏁 All users left room, ending session for ${roomId}`
              );
              await endSession(roomId, sessionData, "completed");
            } else if (
              sessionData.participants.size === 1 &&
              !sessionData.isPaused
            ) {
              // One user left - pause the session
              sessionData.isPaused = true;
              sessionData.pausedAt = new Date();

              // Update session in DB
              await Session.findByIdAndUpdate(sessionData.sessionId, {
                status: "paused",
                pausedAt: sessionData.pausedAt,
                activeParticipants: Array.from(sessionData.participants),
              });

              console.log(`⏸️ Session paused for room ${roomId}`);
            }
          } else {
            // Session never started (both users were never present together)
            // Just clean up if both users are gone
            if (sessionData.participants.size === 0) {
              console.log(
                `🗑️ Cleaning up unstarted session for room ${roomId}`
              );
              activeSessions.delete(roomId);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error leaving room:", error);
      }
    });

    // Handle explicit session end (when user clicks "End Session" button)
    socket.on("end_session", async (data) => {
      try {
        const { otherUserId } = data;
        const currentUserId = userId;
        const roomId = [currentUserId.toString(), otherUserId].sort().join("_");

        console.log(
          `🛑 User ${currentUserId} explicitly ending session in room ${roomId}`
        );

        // Check if there's an active session for this room
        const sessionData = activeSessions.get(roomId);

        if (sessionData && sessionData.bothUsersPresent) {
          console.log(
            `📊 Ending session ${sessionData.sessionId} for room ${roomId}`
          );

          // End the session immediately
          await endSession(roomId, sessionData, "completed");

          // Notify the other user that the session has ended
          const otherUserSocketId = userSockets.get(otherUserId.toString());
          if (otherUserSocketId) {
            io.to(otherUserSocketId).emit("session_ended_by_other", {
              message: "The other user has ended the session.",
              endedBy: currentUserId.toString(),
            });
            console.log(
              `📢 Notified user ${otherUserId} that session was ended by ${currentUserId}`
            );
          }

          // Also leave the room
          socket.leave(roomId);
        } else {
          console.log(`⚠️ No active session found for room ${roomId}`);
        }
      } catch (error) {
        console.error("❌ Error ending session:", error);
      }
    });

    // Handle sending messages
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, message } = data;
        const senderId = userId;

        console.log(`💬 Message from ${senderId} to ${receiverId}:`, message);

        // Verify they are matched
        const isMatched = await verifyMatch(senderId, receiverId);
        if (!isMatched) {
          console.log("❌ Match verification failed!");
          socket.emit("error", {
            message: "You are not matched with this user",
          });
          return;
        }

        console.log("✅ Match verified");

        // Get sender and receiver info
        const senderUser = await User.findById(senderId);

        // Check word limit only if sender is a "User" (not Listener)
        if (senderUser.userType === "User") {
          // Count words in the message
          const wordCount = message
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
          console.log(`📝 Message word count: ${wordCount}`);

          let userStats = await UserStats.findOne({ userId: senderId });
          if (!userStats) {
            userStats = await UserStats.create({ userId: senderId });
          }

          // Check if monthly limit needs reset
          const now = new Date();
          const lastReset = new Date(userStats.lastWordResetDate);
          const daysSinceReset = Math.floor(
            (now - lastReset) / (1000 * 60 * 60 * 24)
          );

          // Reset if it's been 30+ days
          if (daysSinceReset >= 30) {
            userStats.wordsUsedThisMonth = 0;
            userStats.lastWordResetDate = now;
            await userStats.save();
            console.log(`🔄 Word count reset for user ${senderId}`);
          }

          // Check if user would exceed limit
          const wordsAfterSend = userStats.wordsUsedThisMonth + wordCount;
          if (wordsAfterSend > userStats.monthlyWordLimit) {
            const wordsRemaining = Math.max(
              0,
              userStats.monthlyWordLimit - userStats.wordsUsedThisMonth
            );
            socket.emit("word_limit_exceeded", {
              message: `Monthly word limit reached! You have ${wordsRemaining} words remaining.`,
              wordsUsed: userStats.wordsUsedThisMonth,
              wordLimit: userStats.monthlyWordLimit,
              wordsRemaining,
            });

            // Notify the receiver (likely a Listener) that this user has hit their limit
            const receiverSocketId = userSockets.get(receiverId.toString());
            if (receiverSocketId) {
              io.to(receiverSocketId).emit("other_user_word_limit_exhausted", {
                userId: senderId.toString(),
                userName: senderUser.name,
                message: `${senderUser.name} has exhausted their monthly word limit.`,
              });
            }

            return;
          }

          // Update word count
          userStats.wordsUsedThisMonth += wordCount;
          userStats.messagesSent += 1;
          await userStats.save();
          console.log(
            `📊 User word count updated: ${userStats.wordsUsedThisMonth}/${userStats.monthlyWordLimit}`
          );

          // Send updated word count to user
          socket.emit("word_count_update", {
            wordsUsed: userStats.wordsUsedThisMonth,
            wordLimit: userStats.monthlyWordLimit,
            wordsRemaining:
              userStats.monthlyWordLimit - userStats.wordsUsedThisMonth,
          });
        }

        // Save message to database (without wordCount field)
        const newMessage = await Message.create({
          senderId,
          receiverId,
          message: message.trim(),
        });

        // Check if sender is a Listener and update stats
        if (senderUser && senderUser.userType === "Listener") {
          let listenerStats = await ListenerStats.findOne({ userId: senderId });

          // Create stats if they don't exist
          if (!listenerStats) {
            listenerStats = await ListenerStats.create({ userId: senderId });
            console.log(
              `✅ [Socket] Created new ListenerStats for ${senderId}`
            );
          }

          // Check if this user is already in the uniqueUsersListenedTo array
          const alreadyListened = listenerStats.uniqueUsersListenedTo.some(
            (userId) => userId.toString() === receiverId.toString()
          );

          if (!alreadyListened) {
            // This is the first message to this user, add them to the array
            listenerStats.uniqueUsersListenedTo.push(receiverId);
            await listenerStats.save();
            console.log(
              `✅ [Socket] Listener ${senderId} now listening to ${listenerStats.uniqueUsersListenedTo.length} unique users`
            );
          }
        }

        // Update receiver stats (messages received) only for Users
        const receiverUser = await User.findById(receiverId);
        if (receiverUser.userType === "User") {
          let receiverStats = await UserStats.findOne({ userId: receiverId });
          if (!receiverStats) {
            receiverStats = await UserStats.create({ userId: receiverId });
          }
          receiverStats.messagesReceived += 1;
          await receiverStats.save();
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
          console.log(
            `❌ User disconnected (grace period expired): ${disconnectedUserId}`
          );
          console.log(`👥 Total connected users: ${userSockets.size}`);

          // Find all active sessions involving this user
          for (const [roomId, sessionData] of activeSessions.entries()) {
            console.log(
              `🔍 Checking session in room ${roomId}, participants:`,
              Array.from(sessionData.participants)
            );

            if (sessionData.participants.has(disconnectedUserId)) {
              console.log(
                `✅ Found session involving ${disconnectedUserId} in room ${roomId}`
              );
              sessionData.participants.delete(disconnectedUserId);

              console.log(
                `📊 Remaining participants in room ${roomId}:`,
                sessionData.participants.size
              );

              // Only end session if it was actually started (both users were present)
              if (sessionData.bothUsersPresent) {
                console.log(
                  `🏁 Ending session for room ${roomId} due to user disconnect`
                );
                await endSession(roomId, sessionData, "completed");
              } else {
                // Session never started, just clean up if no one is left
                if (sessionData.participants.size === 0) {
                  console.log(
                    `🗑️ Cleaning up unstarted session for room ${roomId}`
                  );
                  activeSessions.delete(roomId);
                }
              }
            }
          }

          console.log(`📊 Active sessions after cleanup:`, activeSessions.size);
        } catch (error) {
          console.error("❌ Error handling disconnect:", error);
        }
      }, 30000); // 30-second grace period

      disconnectTimers.set(disconnectedUserId, timer);
      console.log(
        `⏰ Started 30-second grace period timer for ${disconnectedUserId}`
      );
    });
  });

  return io;
};

// Helper function to end a session and update stats
const endSession = async (roomId, sessionData, status = "completed") => {
  try {
    const {
      sessionId,
      userId,
      listenerId,
      startTime,
      totalPausedTime,
      isPaused,
      pausedAt,
    } = sessionData;

    const endTime = new Date();

    // Calculate total paused time (including current pause if session is paused)
    let finalPausedTime = totalPausedTime || 0;
    if (isPaused && pausedAt) {
      const currentPauseDuration = Math.floor((endTime - pausedAt) / 1000);
      finalPausedTime += currentPauseDuration;
    }

    // Calculate active duration (total time - paused time)
    const totalDuration = Math.floor((endTime - startTime) / 1000);
    const activeDurationInSeconds = Math.max(
      0,
      totalDuration - finalPausedTime
    );

    console.log(`⏱️ Ending session ${sessionId}`);
    console.log(`   Total duration: ${totalDuration}s`);
    console.log(`   Paused time: ${finalPausedTime}s`);
    console.log(`   Active duration: ${activeDurationInSeconds}s`);

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
        durationInSeconds: activeDurationInSeconds,
        totalPausedTime: finalPausedTime,
        status,
        statsUpdated: true,
      },
      { new: true }
    );

    console.log(
      `💾 Session ${sessionId} updated in DB with active duration: ${activeDurationInSeconds}s`
    );

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

    // Minimum duration required for session to count (30 minutes = 37 seconds)
    const MIN_SESSION_DURATION = 37;
    const sessionCountsTowardsStats =
      activeDurationInSeconds >= MIN_SESSION_DURATION;

    const updateData = {
      $inc: {
        // Only increment sessionsConducted if duration >= 30 minutes
        sessionsConducted: sessionCountsTowardsStats ? 1 : 0,
        // Always add to totalChatTime regardless of duration
        totalChatTime: activeDurationInSeconds,
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

    console.log(
      `📊 Listener stats updated: sessionsConducted=${updatedListenerStats.sessionsConducted}, totalChatTime=${updatedListenerStats.totalChatTime}s`
    );
    console.log(
      `   ℹ️ Session duration: ${activeDurationInSeconds}s (${
        sessionCountsTowardsStats ? "COUNTS" : "DOES NOT COUNT"
      } towards sessionsConducted - minimum ${MIN_SESSION_DURATION}s required)`
    );

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
          // Only increment sessionsCompleted if duration >= 30 minutes
          sessionsCompleted: sessionCountsTowardsStats ? 1 : 0,
          // Always add to totalSessionTime regardless of duration
          totalSessionTime: activeDurationInSeconds,
        },
      },
      { new: true }
    );

    console.log(
      `📊 User stats updated: sessionsCompleted=${updatedUserStats.sessionsCompleted}, totalSessionTime=${updatedUserStats.totalSessionTime}s`
    );
    console.log(
      `✅ Stats successfully updated - Listener: ${listenerId}, User: ${userId}, Active Duration: ${activeDurationInSeconds}s`
    );

    // Emit session_ended event to both parties
    const userSocketId = userSockets.get(userId.toString());
    const listenerSocketId = userSockets.get(listenerId.toString());

    const sessionEndData = {
      sessionId,
      durationInSeconds: activeDurationInSeconds,
      totalPausedTime: finalPausedTime,
      roomId,
      endTime,
    };

    if (userSocketId) {
      io.to(userSocketId).emit("session_ended", {
        ...sessionEndData,
        requestRating: activeDurationInSeconds >= 37, // Only request rating if 30+ minutes (37 seconds)
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
    allAccepted.forEach((p, i) => {});
  }

  return isMatched;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
