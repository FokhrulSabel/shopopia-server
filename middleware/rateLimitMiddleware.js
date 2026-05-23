import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    return process.env.NODE_ENV === "development";
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many password reset attempts. Please try again in an hour.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.body.email || req.ip;
  },
  skip: (req, res) => {
    return process.env.NODE_ENV === "development";
  },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    return process.env.NODE_ENV === "development";
  },
});

export { authLimiter, passwordResetLimiter, generalLimiter };
