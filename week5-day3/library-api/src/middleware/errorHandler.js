const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err.message);

  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: err.message,
    details: [],
  });
};

export default errorHandler;
