import { Router } from "express";
import {
    acceptAppointment,
    acceptRescheduledTime,
    cancelAppointment,
    createAppointment,
    getAppointment,
    getMyAppointments,
    proposeNewTime,
} from "../controllers/appointment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const appointmentRouter = Router();

// All routes require authentication
appointmentRouter.use(verifyJWT);

// Create appointment request
appointmentRouter.post("/create", createAppointment);

// Get my appointments
appointmentRouter.get("/my-appointments", getMyAppointments);

// Get specific appointment
appointmentRouter.get("/:appointmentId", getAppointment);

// Listener actions
appointmentRouter.patch("/:appointmentId/accept", acceptAppointment);
appointmentRouter.patch("/:appointmentId/propose-time", proposeNewTime);

// User actions
appointmentRouter.patch("/:appointmentId/accept-reschedule", acceptRescheduledTime);

// Cancel appointment
appointmentRouter.patch("/:appointmentId/cancel", cancelAppointment);

export { appointmentRouter };

