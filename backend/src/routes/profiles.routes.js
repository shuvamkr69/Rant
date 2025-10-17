import { Router } from "express";
import {
  acceptProfile,
  fetchMyProfile,
  fetchProfiles,
  rejectProfile,
} from "../controllers/profiles.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const profilesRouter = Router();

profilesRouter.get("/profiles", verifyJWT, fetchProfiles);
profilesRouter.post("/accept", verifyJWT, acceptProfile);
profilesRouter.post("/reject", verifyJWT, rejectProfile);
profilesRouter.get("/myProfile", verifyJWT, fetchMyProfile);

export { profilesRouter };
