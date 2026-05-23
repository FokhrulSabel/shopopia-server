import mongoose from "mongoose";

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reason: {
      type: String,
      enum: ["logout", "password_change", "role_change", "admin_revoke"],
      default: "logout",
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },

  {
    timestamps: true,
  },
);

const TokenBlacklist = mongoose.model("TokenBlacklist", tokenBlacklistSchema);

export default TokenBlacklist;
