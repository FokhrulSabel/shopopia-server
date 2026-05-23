import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import { generateTokens, getTokenExpiry } from "../utils/tokenService.js";
import {
  logLoginAttempt,
  logLogout,
  logPasswordChange,
  logAccountLocked,
} from "../utils/auditLogger.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token to user
  const refreshTokenExpiry = getTokenExpiry(refreshToken);
  await user.addRefreshToken(refreshToken, refreshTokenExpiry, "web");

  // Log audit event
  await logLoginAttempt(email, true, null, req.ip, req.get("user-agent"), user._id);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  let user = await User.findOne({ email });

  if (!user) {
    await logLoginAttempt(email, false, "Invalid credentials", req.ip, req.get("user-agent"));
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    await logAccountLocked(user._id, email, req.ip, req.get("user-agent"));
    res.status(403);
    throw new Error(
      "Your account has been locked due to too many failed login attempts. Please try again later.",
    );
  }

  // Check if user is active
  if (!user.isActive) {
    res.status(401);
    throw new Error("Your account has been deactivated");
  }

  // Check password
  const isPasswordMatched = await user.matchPassword(password);
  if (!isPasswordMatched) {
    // Increment login attempts
    await user.incrementLoginAttempts();
    user = await User.findById(user._id);

    await logLoginAttempt(
      email,
      false,
      `Failed attempt ${user.loginAttempts}/5`,
      req.ip,
      req.get("user-agent"),
      user._id,
    );

    if (user.isAccountLocked()) {
      await logAccountLocked(user._id, email, req.ip, req.get("user-agent"));
      res.status(403);
      throw new Error(
        "Your account has been locked due to too many failed login attempts.",
      );
    }

    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token to user
  const refreshTokenExpiry = getTokenExpiry(refreshToken);
  await user.addRefreshToken(refreshToken, refreshTokenExpiry, "web");

  // Log successful login
  await logLoginAttempt(email, true, null, req.ip, req.get("user-agent"), user._id);

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401);
    throw new Error("Refresh token not provided");
  }

  // Find user with this refresh token
  const user = await User.findOne({ "refreshTokens.token": refreshToken });

  if (!user) {
    res.status(401);
    throw new Error("Invalid refresh token");
  }

  // Verify refresh token is valid
  const validRefreshToken = user.findValidRefreshToken(refreshToken);
  if (!validRefreshToken) {
    res.status(401);
    throw new Error("Refresh token expired or invalid");
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

  // Remove old refresh token and add new one (token rotation)
  await user.removeRefreshToken(refreshToken);
  const newRefreshTokenExpiry = getTokenExpiry(newRefreshToken);
  await user.addRefreshToken(newRefreshToken, newRefreshTokenExpiry, "web");

  // Set new refresh token as httpOnly cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
  });
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Protected
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      permissions: user.permissions,
    },
  });
});

// @desc    Update user profile
// @route   PATCH /api/auth/profile
// @access  Protected
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (name) user.name = name;
  if (avatar) user.avatar = avatar;

  await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Protected
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Verify current password
  const isPasswordMatched = await user.matchPassword(currentPassword);
  if (!isPasswordMatched) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  // Clear all refresh tokens (invalidate all sessions)
  await user.clearRefreshTokens();

  // Log password change
  await logPasswordChange(user._id, user.email, req.ip, req.get("user-agent"));

  res.json({
    success: true,
    message: "Password changed successfully. Please login again.",
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Protected
const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  const user = await User.findById(req.user._id);

  if (user && refreshToken) {
    await user.removeRefreshToken(refreshToken);
    await logLogout(user._id, user.email, req.ip, req.get("user-agent"));
  }

  res.clearCookie("refreshToken");

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// @desc    Get all sessions for user
// @route   GET /api/auth/sessions
// @access  Protected
const getUserSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const sessions = user.refreshTokens.map((rt) => ({
    deviceId: rt.deviceId,
    createdAt: rt.createdAt,
    expiresAt: rt.expiresAt,
  }));

  res.json({
    success: true,
    data: sessions,
  });
});

// @desc    Logout from specific device
// @route   DELETE /api/auth/sessions/:deviceId
// @access  Protected
const logoutFromDevice = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const refreshToken = user.refreshTokens.find((rt) => rt.deviceId === deviceId)?.token;

  if (refreshToken) {
    await user.removeRefreshToken(refreshToken);
  }

  res.json({
    success: true,
    message: "Logged out from device successfully",
  });
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  changePassword,
  logoutUser,
  getUserSessions,
  logoutFromDevice,
};
