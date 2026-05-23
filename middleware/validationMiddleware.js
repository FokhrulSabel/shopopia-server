const validateRegisterInput = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;

  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Valid name is required");
  }

  if (!email || typeof email !== "string" || email.trim().length === 0) {
    errors.push("Valid email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format");
  }

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  } else if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  } else if (!/[@$!%*?&]/.test(password)) {
    errors.push("Password must contain at least one special character (@$!%*?&)");
  }

  if (password !== confirmPassword) {
    errors.push("Passwords do not match");
  }

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join(", "));
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  if (!email || typeof email !== "string" || email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format");
  }

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join(", "));
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const errors = [];

  if (!currentPassword) {
    errors.push("Current password is required");
  }

  if (!newPassword || typeof newPassword !== "string") {
    errors.push("New password is required");
  } else if (newPassword.length < 8) {
    errors.push("New password must be at least 8 characters");
  } else if (!/[A-Z]/.test(newPassword)) {
    errors.push("New password must contain at least one uppercase letter");
  } else if (!/[a-z]/.test(newPassword)) {
    errors.push("New password must contain at least one lowercase letter");
  } else if (!/\d/.test(newPassword)) {
    errors.push("New password must contain at least one number");
  } else if (!/[@$!%*?&]/.test(newPassword)) {
    errors.push(
      "New password must contain at least one special character (@$!%*?&)",
    );
  }

  if (newPassword !== confirmPassword) {
    errors.push("New passwords do not match");
  }

  if (newPassword === currentPassword) {
    errors.push("New password must be different from current password");
  }

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join(", "));
  }

  next();
};

export { validateRegisterInput, validateLoginInput, validatePasswordChange };
