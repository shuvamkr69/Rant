import { Router } from "express";
import {
  getAllReports,
  getMyReports,
  submitReport,
} from "../controllers/report.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const reportRouter = Router();

// User routes
reportRouter.post("/submit", verifyJWT, submitReport);
reportRouter.get("/my-reports", verifyJWT, getMyReports);

// Admin routes (optional - add admin middleware if needed)
reportRouter.get("/all", verifyJWT, getAllReports);

export { reportRouter };
