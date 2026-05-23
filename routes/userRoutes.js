import express from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  changePassword,
  logoutUser,
  getUserSessions,
  logoutFromDevice,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Public Routes
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/refresh", refreshAccessToken);

// Protected Routes
router.get("/profile", protect, getUserProfile);
router.patch("/profile", protect, updateUserProfile);
router.post("/change-password", protect, changePassword);
router.post("/logout", protect, logoutUser);
router.get("/sessions", protect, getUserSessions);
router.delete("/sessions/:deviceId", protect, logoutFromDevice);

export default router;
