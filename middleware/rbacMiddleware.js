const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authenticated");
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `User role '${req.user.role}' is not authorized to access this resource`,
      );
    }

    next();
  };
};

const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authenticated");
    }

    const userPermissions = req.user.permissions || [];

    const hasPermission = Array.isArray(requiredPermissions)
      ? requiredPermissions.some((perm) => userPermissions.includes(perm))
      : userPermissions.includes(requiredPermissions);

    if (!hasPermission) {
      res.status(403);
      throw new Error("Insufficient permissions to access this resource");
    }

    next();
  };
};

export { authorize, checkPermission };
