const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/response");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return sendError(res, "Access denied. No token provided.", 403);
  }

  try {
    // Assuming token is sent as 'Bearer <token>'
    const tokenString = token.startsWith("Bearer ") ? token.slice(7) : token;
    
    const decoded = jwt.verify(tokenString, JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (error) {
    return sendError(res, "Invalid token.", 401);
  }
};

module.exports = {
  verifyToken,
};
