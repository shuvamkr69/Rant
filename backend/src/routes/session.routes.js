import { Router } from "express";
import {
    getActiveSessions,
    getListenerStats,
    getMySessionHistory,
    getSessions,
    submitRating,
} from "../controllers/session.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const sessionRouter = Router();

// Protected routes
sessionRouter.get("/", verifyJWT, getSessions);
sessionRouter.get("/active", verifyJWT, getActiveSessions);
sessionRouter.get("/my-history", verifyJWT, getMySessionHistory);
sessionRouter.get("/listener-stats/:id", getListenerStats); // Public route
sessionRouter.post("/rate", verifyJWT, submitRating);

export { sessionRouter };
