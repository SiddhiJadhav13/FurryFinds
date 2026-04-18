const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
    message = "Database service is currently unavailable. Please try again in a moment.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
