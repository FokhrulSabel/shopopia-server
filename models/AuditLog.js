import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    email: String,

    event: {
      type: String,
      enum: [
        "login_success",
        "login_failed",
        "logout",
        "password_changed",
        "password_reset",
        "account_locked",
        "account_unlocked",
        "role_changed",
        "permission_changed",
        "profile_updated",
        "refresh_token_issued",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },

    reason: String,

    ipAddress: String,

    userAgent: String,

    deviceId: String,

    metadata: mongoose.Schema.Types.Mixed,
  },

  {
    timestamps: true,
  },
);

// Index for user lookups
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ email: 1, createdAt: -1 });
auditLogSchema.index({ event: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
