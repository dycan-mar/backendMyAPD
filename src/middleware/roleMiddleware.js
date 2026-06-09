const { sendError } = require("../utils/response");

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Access denied. User not authenticated.", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, "Forbidden. You do not have permission to access this resource.", 403);
    }

    next();
  };
};

module.exports = {
  checkRole,
};
