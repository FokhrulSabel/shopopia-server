const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === "development";

  const errorResponse = {
    success: false,
    message: err.message || "Internal Server Error",
    ...(isDevelopment && { stack: err.stack }),
  };

  console.error(`❌ Error [${statusCode}]: ${err.message}`);

  res.status(statusCode).json(errorResponse);
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    err.statusCode = err.statusCode || 500;
    next(err);
  });
};

export { errorHandler, asyncHandler };
