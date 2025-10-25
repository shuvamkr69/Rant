import { ListenerStats } from "../models/listenerStat.model.js";
import { Session } from "../models/session.model.js";

// Get all sessions (with filters)
export const getSessions = async (req, res) => {
  try {
    const { status, userId, listenerId, limit = 50 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (listenerId) filter.listenerId = listenerId;

    const sessions = await Session.find(filter)
      .populate("userId", "name userType")
      .populate("listenerId", "name userType")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("❌ Error fetching sessions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get active sessions
export const getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("userId", "name userType")
      .populate("listenerId", "name userType")
      .sort({ startTime: -1 });

    res.status(200).json({ activeSessions: sessions });
  } catch (error) {
    console.error("❌ Error fetching active sessions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get session history for current user
export const getMySessionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, page = 1 } = req.query;

    const sessions = await Session.find({
      $or: [{ userId }, { listenerId: userId }],
    })
      .populate("userId", "name userType")
      .populate("listenerId", "name userType")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Session.countDocuments({
      $or: [{ userId }, { listenerId: userId }],
    });

    res.status(200).json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.floor(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching session history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get listener stats
export const getListenerStats = async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await ListenerStats.findOne({ userId: id });
    
    if (!stats) {
      return res.status(404).json({ message: "Listener stats not found" });
    }

    // Calculate derived values
    const enrichedStats = {
      ...stats.toObject(),
      uniqueUsersCount: stats.uniqueUsersListenedTo.length,
      averageSessionDuration: stats.sessionsConducted > 0 
        ? Math.round(stats.totalChatTime / stats.sessionsConducted) 
        : 0,
    };

    res.status(200).json({ stats: enrichedStats });
  } catch (error) {
    console.error("❌ Error fetching listener stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Submit rating and review
export const submitRating = async (req, res) => {
  try {
    const userId = req.user._id;
    const { listenerId, sessionId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Verify the session exists and user was part of it
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only rate sessions you participated in" });
    }

    if (session.status !== "completed") {
      return res.status(400).json({ message: "Can only rate completed sessions" });
    }

    // Update listener stats with rating
    const listenerStats = await ListenerStats.findOne({ userId: listenerId });
    if (!listenerStats) {
      return res.status(404).json({ message: "Listener stats not found" });
    }

    // Add review
    listenerStats.reviews.push({
      userId,
      rating,
      comment,
      createdAt: new Date(),
    });

    // Update average rating
    const totalRatings = listenerStats.totalRatings + 1;
    const currentTotal = listenerStats.averageRating * listenerStats.totalRatings;
    const newAverage = (currentTotal + rating) / totalRatings;

    listenerStats.totalRatings = totalRatings;
    listenerStats.averageRating = Math.round(newAverage * 10) / 10; // Round to 1 decimal

    await listenerStats.save();

    res.status(200).json({
      message: "Rating submitted successfully",
      averageRating: listenerStats.averageRating,
      totalRatings: listenerStats.totalRatings,
    });
  } catch (error) {
    console.error("❌ Error submitting rating:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
