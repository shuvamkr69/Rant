import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { verifyPurchase } from "./controllers/subscription.controller.js";
import { verifyJWT } from "./middlewares/auth.middleware.js";
import mainRouter from "./routes/main.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.route("/subscription/verify").post(verifyJWT, verifyPurchase);
app.use("/api/v1/users", mainRouter);

export default app;
