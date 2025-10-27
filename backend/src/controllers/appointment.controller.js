import { Appointment } from "../models/appointment.model.js";
import { ListenerStats } from "../models/listenerStat.model.js";
import { User } from "../models/user.model.js";
import { UserStats } from "../models/userStats.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create appointment request
export const createAppointment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { listenerId, requestedDate, requestedTime, duration, notes } = req.body;

  if (!listenerId || !requestedDate || !requestedTime) {
    throw new ApiError(400, "Listener ID, date, and time are required");
  }

  // Verify listener exists and is a Listener type
  const listener = await User.findById(listenerId);
  if (!listener || listener.userType !== "Listener") {
    throw new ApiError(404, "Listener not found");
  }

  // Check if user is trying to book themselves
  if (userId.toString() === listenerId) {
    throw new ApiError(400, "Cannot book appointment with yourself");
  }

  // Create appointment
  const appointment = await Appointment.create({
    userId,
    listenerId,
    requestedDate,
    requestedTime,
    duration: duration || 60,
    notes,
    status: "pending",
  });

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate("userId", "name profileImage")
    .populate("listenerId", "name profileImage charge");

  res.status(201).json({
    success: true,
    message: "Appointment request sent",
    appointment: populatedAppointment,
  });
});

// Get my appointments (both as user and listener)
export const getMyAppointments = asyncHandler(async (req, res) => {
  const myId = req.user._id;
  const { role, status } = req.query; // role: 'user' | 'listener', status: 'pending' | 'accepted' etc.

  let query = {};
  
  if (role === "user") {
    query.userId = myId;
  } else if (role === "listener") {
    query.listenerId = myId;
  } else {
    // Get both
    query.$or = [{ userId: myId }, { listenerId: myId }];
  }

  if (status) {
    query.status = status;
  }

  const appointments = await Appointment.find(query)
    .populate("userId", "name profileImage mobileNumber")
    .populate("listenerId", "name profileImage charge occupation")
    .sort({ requestedDate: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: appointments.length,
    appointments,
  });
});

// Listener accepts appointment
export const acceptAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const listenerId = req.user._id;

  const appointment = await Appointment.findById(appointmentId);
  
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.listenerId.toString() !== listenerId.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (appointment.status !== "pending") {
    throw new ApiError(400, "Appointment is not pending");
  }

  appointment.status = "accepted";
  await appointment.save();

  const populatedAppointment = await Appointment.findById(appointmentId)
    .populate("userId", "name profileImage")
    .populate("listenerId", "name profileImage charge");

  res.status(200).json({
    success: true,
    message: "Appointment accepted",
    appointment: populatedAppointment,
  });
});

// Listener proposes new time
export const proposeNewTime = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const listenerId = req.user._id;
  const { proposedDate, proposedTime } = req.body;

  if (!proposedDate || !proposedTime) {
    throw new ApiError(400, "Proposed date and time are required");
  }

  const appointment = await Appointment.findById(appointmentId);
  
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.listenerId.toString() !== listenerId.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  appointment.proposedDate = proposedDate;
  appointment.proposedTime = proposedTime;
  appointment.status = "rescheduled";
  await appointment.save();

  const populatedAppointment = await Appointment.findById(appointmentId)
    .populate("userId", "name profileImage")
    .populate("listenerId", "name profileImage charge");

  res.status(200).json({
    success: true,
    message: "New time proposed",
    appointment: populatedAppointment,
  });
});

// User accepts rescheduled time
export const acceptRescheduledTime = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user._id;

  const appointment = await Appointment.findById(appointmentId);
  
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.userId.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (appointment.status !== "rescheduled") {
    throw new ApiError(400, "Appointment is not in rescheduled status");
  }

  // Update to proposed time
  appointment.requestedDate = appointment.proposedDate;
  appointment.requestedTime = appointment.proposedTime;
  appointment.proposedDate = null;
  appointment.proposedTime = null;
  appointment.status = "accepted";
  await appointment.save();

  const populatedAppointment = await Appointment.findById(appointmentId)
    .populate("userId", "name profileImage")
    .populate("listenerId", "name profileImage charge");

  res.status(200).json({
    success: true,
    message: "Rescheduled time accepted",
    appointment: populatedAppointment,
  });
});

// Cancel appointment
export const cancelAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const currentUserId = req.user._id;

  const appointment = await Appointment.findById(appointmentId);
  
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  // Only user or listener can cancel
  if (
    appointment.userId.toString() !== currentUserId.toString() &&
    appointment.listenerId.toString() !== currentUserId.toString()
  ) {
    throw new ApiError(403, "Not authorized");
  }

  appointment.status = "cancelled";
  await appointment.save();

  res.status(200).json({
    success: true,
    message: "Appointment cancelled",
  });
});

// Get specific appointment
export const getAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findById(appointmentId)
    .populate("userId", "name profileImage mobileNumber")
    .populate("listenerId", "name profileImage charge occupation");

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  res.status(200).json({
    success: true,
    appointment,
  });
});

// Process payment after session ends
export const processSessionPayment = async (appointmentId, actualDurationInSeconds) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      console.error("Appointment not found for payment processing");
      return;
    }

    const listener = await User.findById(appointment.listenerId);
    if (!listener) {
      console.error("Listener not found for payment processing");
      return;
    }

    // Calculate amount: (hourlyCharge / 3600) * actualDurationInSeconds
    const chargePerSecond = (listener.charge || 0) / 3600;
    const amountToCharge = Math.ceil(chargePerSecond * actualDurationInSeconds);

    // Update user stats (deduct from wallet)
    const userStats = await UserStats.findOne({ userId: appointment.userId });
    if (userStats) {
      userStats.walletBalance = Math.max(0, (userStats.walletBalance || 0) - amountToCharge);
      await userStats.save();
    }

    // Update listener stats (add to wallet)
    const listenerStats = await ListenerStats.findOne({ userId: appointment.listenerId });
    if (listenerStats) {
      listenerStats.walletBalance = (listenerStats.walletBalance || 0) + amountToCharge;
      await listenerStats.save();
    }

    // Update appointment with payment details
    appointment.actualDuration = actualDurationInSeconds;
    appointment.amountCharged = amountToCharge;
    appointment.status = "completed";
    await appointment.save();

    console.log(`💰 Payment processed: ₹${amountToCharge} (${actualDurationInSeconds}s) - User ${appointment.userId} → Listener ${appointment.listenerId}`);

    return { amountCharged: amountToCharge };
  } catch (error) {
    console.error("Error processing session payment:", error);
    return null;
  }
};
