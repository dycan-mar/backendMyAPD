const prisma = require("../config/prisma");
const { sendSuccess, sendError } = require("../utils/response");

const getAllApd = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const [apdList, total] = await Promise.all([
      prisma.apd.findMany({
        where: { deletedAt: null },
        skip: skip,
        take: limitNumber,
      }),
      prisma.apd.count({ where: { deletedAt: null } })
    ]);

    return res.status(200).json({
      success: true,
      message: "Success",
      data: apdList,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error("Error fetching APD:", error);
    return sendError(res, "Failed to fetch APD data");
  }
};

const getApdById = async (req, res) => {
  try {
    const { id } = req.params;
    const apd = await prisma.apd.findFirst({
      where: { id: Number(id), deletedAt: null },
    });
    
    if (!apd) {
      return sendError(res, "APD not found", 404);
    }
    
    return sendSuccess(res, apd);
  } catch (error) {
    console.error("Error fetching APD:", error);
    return sendError(res, "Failed to fetch APD by ID");
  }
};

const createApd = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return sendError(res, "Name is required and cannot be empty", 400);
    }

    const apd = await prisma.apd.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
      },
    });

    return sendSuccess(res, apd, 201);
  } catch (error) {
    console.error("Error creating APD:", error);
    return sendError(res, "Failed to create APD");
  }
};

const updateApd = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if exists
    const existingApd = await prisma.apd.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existingApd) {
      return sendError(res, "APD not found", 404);
    }

    const updateData = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return sendError(res, "Name cannot be empty", 400);
      }
      updateData.name = name.trim();
    }
    
    if (description !== undefined) {
      updateData.description = description.trim();
    }

    const apd = await prisma.apd.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return sendSuccess(res, apd);
  } catch (error) {
    console.error("Error updating APD:", error);
    return sendError(res, "Failed to update APD");
  }
};

const deleteApd = async (req, res) => {
  try {
    const { id } = req.params;

    const existingApd = await prisma.apd.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existingApd) {
      return sendError(res, "APD not found", 404);
    }

    await prisma.apd.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    return sendSuccess(res, null);
  } catch (error) {
    console.error("Error deleting APD:", error);
    return sendError(res, "Failed to delete APD");
  }
};

module.exports = {
  getAllApd,
  getApdById,
  createApd,
  updateApd,
  deleteApd,
};
