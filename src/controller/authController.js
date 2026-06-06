const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendSuccess, sendError } = require("../utils/response");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const login = async (req, res) => {
  try {
    const { nid, password } = req.body;

    if (!nid || !password) {
      return sendError(res, "NID and password are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { nid } });

    if (!user) {
      return sendError(res, "Invalid NID or password", 401);
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return sendError(res, "Account is temporarily locked due to multiple failed login attempts. Please try again after 1 minute.", 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Handle failed attempt
      const newFailedAttempts = user.failedAttempts + 1;
      let updateData = { failedAttempts: newFailedAttempts };

      if (newFailedAttempts >= 5) {
        // Lock for 1 minute
        const lockTime = new Date();
        lockTime.setMinutes(lockTime.getMinutes() + 1);
        updateData.lockedUntil = lockTime;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      return sendError(res, "Invalid NID or password", 401);
    }

    // Login successful, reset failed attempts and lock
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, nid: user.nid, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" } // Token expires in 7 day
    );

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        nid: user.nid,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, "An error occurred during login", 500);
  }
};

module.exports = {
  login,
};
