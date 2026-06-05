const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const { sendSuccess, sendError } = require("../utils/response");

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        nid: true,
        role: true,
        createdAt: true,
      },
    });
    return sendSuccess(res, users);
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

    if (!nid || !password) {
      return sendError(res, "NID and password are required", 400);
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

    const existingUser = await prisma.user.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existingUser) {
      return sendError(res, "User not found", 404);
    }

    const updateData = {};
    if (nid) updateData.nid = nid;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
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
