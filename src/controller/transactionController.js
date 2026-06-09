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

const getAllTransactions = async (req, res) => {
  try {
    const { status, apdId, userId, limit } = req.query;
    const where = { deletedAt: null };

    // Role-based filtering: Karyawan can only see their own transactions
    if (req.user.role === "karyawan") {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = Number(userId);
    }

    // Optional filters
    if (status) where.status = status;
    if (apdId) where.apdId = Number(apdId);

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { waktu: 'desc' },
      take: limit ? Number(limit) : undefined,
      include: {
        apd: true,
        user: { select: { id: true, nid: true, role: true } },
      }
    });

    return sendSuccess(res, transactions, 200);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return sendError(res, "Failed to fetch transactions");
  }
};

const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved"].includes(status)) {
      return sendError(res, "Invalid status. Must be 'pending' or 'approved'", 400);
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: { id: Number(id), deletedAt: null },
    });

    if (!existingTransaction) {
      return sendError(res, "Transaction not found", 404);
    }

    // Only admin can approve (enforced by route middleware checkRole)
    const updatedTransaction = await prisma.transaction.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        apd: true,
        user: { select: { id: true, nid: true, role: true } },
      }
    });

    return sendSuccess(res, updatedTransaction, 200);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return sendError(res, "Failed to update transaction status");
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  updateTransactionStatus,
};
