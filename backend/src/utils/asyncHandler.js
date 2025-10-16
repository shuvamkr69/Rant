const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error("❌ Error caught in asyncHandler:", error);

    let statusCode = 500; // default Internal Server Error
    let message = error.message || "Something went wrong";

    // Handle MongoDB duplicate key error
    if (error.code && error.code === 11000) {
      statusCode = 409; // Conflict
      message = "Duplicate key error: resource already exists";
    }

    // Handle validation errors (Mongoose)
    if (error.name === "ValidationError") {
      statusCode = 422; // Unprocessable Entity
      message = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
    }

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export { asyncHandler };
