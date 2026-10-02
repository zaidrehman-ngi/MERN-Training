const requestId = (req, res, next) => {
  const id = `req-${Date.now()}`;

  req.requestId = id;
  res.set("X-Request-Id", id);

  console.log("APP:", req.method, req.path, id);

  next();
};

export default requestId;
