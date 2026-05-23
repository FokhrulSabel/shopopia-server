import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { generalLimiter } from "./middleware/rateLimitMiddleware.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Validate required environment variables
const validateEnv = () => {
  const required = [
    "MONGO_URI",
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
    "FRONTEND_URL",
  ];
  const missing = required.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
};

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["X-Total-Count"],
    maxAge: 600,
  }),
);

// Body Parser Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate Limiting
app.use(generalLimiter);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", userRoutes);

// Test Route
app.get("/", (req, res) => {
  res.json({
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method,
  });
});

// Global Error Handler (must be last)
app.use(errorHandler);

// Initialize Server
const startServer = async () => {
  try {
    validateEnv();

    // Connect Database
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

    // Graceful Shutdown Handlers
    const shutdown = (signal) => {
      console.log(`\n📛 Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("❌ Forced shutdown due to timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.error("❌ Uncaught Exception:", err);
      process.exit(1);
    });

    // Handle unhandled rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

