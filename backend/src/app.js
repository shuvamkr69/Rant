import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mainRouter from "./routes/main.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Mount subscription routes directly (for IAP endpoints)
app.use("/subscription", subscriptionRouter);

// Mount other routes under /api/v1/users
app.use("/api/v1/users", mainRouter);

export default app;
