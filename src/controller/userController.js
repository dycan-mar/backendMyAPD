const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const { sendSuccess, sendError } = require("../utils/response");

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null },
        skip: skip,
        take: limitNumber,
        select: {
          id: true,
          nid: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: { deletedAt: null } })
    ]);

    return res.status(200).json({
      success: true,
      message: "Success",
      data: users,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return sendError(res, "Failed to fetch users");
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findFirst({
      where: { id: Number(id), deletedAt: null },
      select: {
        id: true,
        nid: true,
        role: true,
        createdAt: true,
      },
    });
    return sendSuccess(res, user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return sendError(res, "Failed to fetch user by ID");
  }
};

const createUser = async (req, res) => {
  try {
    const { nid, password, role } = req.body;

    if (!nid || typeof nid !== "string" || nid.trim() === "") {
      return sendError(res, "NID is required and must be a string", 400);
    }
    if (!password || typeof password !== "string" || password.trim() === "") {
      return sendError(res, "Password is required and must be a string", 400);
    }
    const validRoles = ["admin", "karyawan", "mandor"];
    if (role && !validRoles.includes(role)) {
      return sendError(res, "Invalid role", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { nid } });
    if (existingUser) {
      return sendError(res, "User with this NID already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        nid,
        password: hashedPassword,
        role: role || "karyawan",
      },
      select: {
        id: true,
        nid: true,
        role: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, user, 201);
  } catch (error) {
    console.error("Error creating user:", error);
    return sendError(res, "Failed to create user");
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nid, password, role } = req.body;

    if (!id || isNaN(Number(id))) {
      return sendError(res, "Invalid user ID", 400);
    }

    const existingUser = await prisma.user.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existingUser) {
      return sendError(res, "User not found", 404);
    }

    const updateData = {};
    if (nid !== undefined) {
      if (typeof nid !== "string" || nid.trim() === "") {
        return sendError(res, "NID cannot be empty", 400);
      }
      updateData.nid = nid.trim();
    }
    
    const validRoles = ["admin", "karyawan", "mandor"];
    if (role !== undefined) {
      if (!validRoles.includes(role)) {
        return sendError(res, "Invalid role", 400);
      }
      updateData.role = role;
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.trim() === "") {
         return sendError(res, "Password cannot be empty", 400);
      }
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        nid: true,
        role: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, user);
  } catch (error) {
    console.error("Error updating user:", error);
    return sendError(res, "Failed to update user");
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return sendError(res, "Invalid user ID", 400);
    }

    const existingUser = await prisma.user.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existingUser) {
      return sendError(res, "User not found", 404);
    }

    await prisma.user.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    return sendSuccess(res, null);
  } catch (error) {
    console.error("Error deleting user:", error);
    return sendError(res, "Failed to delete user");
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
