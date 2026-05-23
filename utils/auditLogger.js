import AuditLog from "../models/AuditLog.js";

const logEvent = async (
  event,
  {
    userId,
    email,
    status = "success",
    reason,
    ipAddress,
    userAgent,
    deviceId,
    metadata,
  } = {},
) => {
  try {
    await AuditLog.create({
      userId,
      email,
      event,
      status,
      reason,
      ipAddress,
      userAgent,
      deviceId,
      metadata,
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
};

const logLoginAttempt = async (
  email,
  success,
  reason = null,
  ipAddress = null,
  userAgent = null,
  userId = null,
) => {
  await logEvent(success ? "login_success" : "login_failed", {
    userId,
    email,
    status: success ? "success" : "failure",
    reason,
    ipAddress,
    userAgent,
  });
};

const logLogout = async (userId, email, ipAddress = null, userAgent = null) => {
  await logEvent("logout", {
    userId,
    email,
    ipAddress,
    userAgent,
  });
};

const logPasswordChange = async (
  userId,
  email,
  ipAddress = null,
  userAgent = null,
) => {
  await logEvent("password_changed", {
    userId,
    email,
    ipAddress,
    userAgent,
  });
};

const logAccountLocked = async (
  userId,
  email,
  ipAddress = null,
  userAgent = null,
) => {
  await logEvent("account_locked", {
    userId,
    email,
    ipAddress,
    userAgent,
  });
};

const logRoleChange = async (
  userId,
  email,
  newRole,
  ipAddress = null,
  userAgent = null,
) => {
  await logEvent("role_changed", {
    userId,
    email,
    ipAddress,
    userAgent,
    metadata: { newRole },
  });
};

export {
  logEvent,
  logLoginAttempt,
  logLogout,
  logPasswordChange,
  logAccountLocked,
  logRoleChange,
};
