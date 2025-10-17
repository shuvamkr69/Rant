import dotenv from "dotenv";
import { createServer } from "http";
import app from "./app.js";
import connectDB from "./db/index.js";
import { initializeSocket } from "./socket.js";

// Load environment variables first
dotenv.config({ path: "../.env" });

const server = createServer(app);

// Initialize Socket.io
initializeSocket(server);

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at: http://localhost:${PORT}`);
      console.log(`🔌 Socket.IO listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
};

startServer();
