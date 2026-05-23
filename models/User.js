import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin", "seller", "moderator"],
      default: "user",
    },

    permissions: {
      type: [String],
      default: [],
    },

    avatar: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    refreshTokens: [
      {
        token: String,
        expiresAt: Date,
        deviceId: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    passwordChangedAt: Date,

    lastLogin: Date,

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,
  },

  {
    timestamps: true,
  },
);

// Hash Password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);

  next();
});

// Compare Password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
userSchema.methods.isAccountLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      loginAttempts: 1,
      lockUntil: null,
    });
  }

  const updates = {
    loginAttempts: this.loginAttempts + 1,
  };

  // Lock account after 5 attempts
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }

  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    loginAttempts: 0,
    lockUntil: null,
  });
};

// Add refresh token
userSchema.methods.addRefreshToken = function (token, expiresAt, deviceId) {
  this.refreshTokens.push({
    token,
    expiresAt,
    deviceId,
  });
  return this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
  return this.save();
};

// Clear all refresh tokens
userSchema.methods.clearRefreshTokens = async function () {
  this.refreshTokens = [];
  return this.save();
};

// Find valid refresh token
userSchema.methods.findValidRefreshToken = function (token) {
  const rt = this.refreshTokens.find((rt) => rt.token === token);
  if (!rt) return null;

  if (rt.expiresAt < new Date()) {
    this.removeRefreshToken(token);
    return null;
  }

  return rt;
};

const User = mongoose.model("User", userSchema);

export default User;
