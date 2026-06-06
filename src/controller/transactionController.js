const prisma = require("../config/prisma");
const { sendSuccess, sendError } = require("../utils/response");

const createTransaction = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return sendError(res, "Foto APD is required", 400);
    }

    const { tempat, waktu, apdId } = req.body;
    const userId = req.user.id; // From verifyToken middleware

    // Validate tempat
    if (!tempat || typeof tempat !== "string" || tempat.trim() === "") {
      return sendError(res, "Tempat is required and cannot be empty", 400);
    }

    // Validate apdId
    if (!apdId || isNaN(Number(apdId))) {
      return sendError(res, "Valid apdId is required", 400);
    }

    // Check if APD exists
    const existingApd = await prisma.apd.findFirst({
      where: { id: Number(apdId), deletedAt: null },
    });

    if (!existingApd) {
      return sendError(res, "APD with the given ID not found", 404);
    }

    // Validate and Parse waktu
    if (!waktu) {
      return sendError(res, "Waktu is required", 400);
    }
    
    const transactionTime = new Date(waktu);
    if (isNaN(transactionTime.getTime())) {
      return sendError(res, "Invalid waktu format", 400);
    }

    // Prepare foto path (relative to static server)
    const fotoUrl = `/uploads/${req.file.filename}`;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        foto: fotoUrl,
        tempat: tempat.trim(),
        waktu: transactionTime,
        userId: userId,
        apdId: Number(apdId),
      },
      include: {
        apd: true, // Optionally return the related APD info
        user: { select: { id: true, nid: true, role: true } }, // Safely return user info
      }
    });

    return sendSuccess(res, transaction, 201);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return sendError(res, "Failed to create transaction");
  }
};

module.exports = {
  createTransaction,
};
