import { Report } from "../models/report.model.js";
import { User } from "../models/user.model.js";
import { sendReportEmail } from "../utils/emailService.js";

/**
 * Submit a report against a user
 */
export const submitReport = async (req, res) => {
  try {
    const reporterId = req.user._id;
    const { reportedUserId, reason, message, sessionId } = req.body;

    console.log("📝 Report submission received:", {
      reporterId,
      reportedUserId,
      reason,
    });

    // Validation
    if (!reportedUserId || !reason || !message) {
      return res.status(400).json({
        success: false,
        message: "Reported user ID, reason, and message are required",
      });
    }

    // Check if message is not empty and within limit
    if (!message.trim() || message.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 1 and 500 characters",
      });
    }

    // Verify reporter and reported user exist
    const reporter = await User.findById(reporterId);
    const reportedUser = await User.findById(reportedUserId);

    if (!reporter || !reportedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if reporter is a User (only users can report listeners)
    if (reporter.userType !== "User") {
      return res.status(403).json({
        success: false,
        message: "Only users can submit reports",
      });
    }

    // Check if reported user is a Listener
    if (reportedUser.userType !== "Listener") {
      return res.status(400).json({
        success: false,
        message: "You can only report listeners",
      });
    }

    // Prevent self-reporting
    if (reporterId.toString() === reportedUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot report yourself",
      });
    }

    // Create the report
    const report = await Report.create({
      reporterId,
      reportedUserId,
      reason,
      message: message.trim(),
      sessionId: sessionId || undefined,
      status: "pending",
    });

    console.log("✅ Report created:", report._id);

    // Send email notification
    try {
      await sendReportEmail({
        reporterName: reporter.name,
        reporterEmail: reporter.email || reporter.mobileNumber,
        reportedUserName: reportedUser.name,
        reportedUserId: reportedUser._id,
        reason,
        message: message.trim(),
        reportId: report._id,
        timestamp: report.createdAt,
      });
      console.log("✅ Email notification sent successfully");
    } catch (emailError) {
      console.error("⚠️ Failed to send email notification:", emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      success: true,
      message:
        "Report submitted successfully. Our team will review it shortly.",
      reportId: report._id,
    });
  } catch (error) {
    console.error("❌ Error submitting report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit report",
      error: error.message,
    });
  }
};

/**
 * Get all reports (admin use - optional)
 */
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporterId", "name email mobileNumber userType")
      .populate("reportedUserId", "name email mobileNumber userType")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("❌ Error fetching reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
      error: error.message,
    });
  }
};

/**
 * Get reports by user (reports they've submitted)
 */
export const getMyReports = async (req, res) => {
  try {
    const userId = req.user._id;

    const reports = await Report.find({ reporterId: userId })
      .populate("reportedUserId", "name userType")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("❌ Error fetching user reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your reports",
      error: error.message,
    });
  }
};
