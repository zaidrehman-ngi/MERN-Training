import logger from "../config/logger.js";

const requestId = (req, res, next) => {
  const id = `req-${Date.now()}`;

  req.requestId = id;
  res.set("X-Request-Id", id);

  logger.debug("APP:", req.method, req.path, id);

  next();
};

export default requestId;
