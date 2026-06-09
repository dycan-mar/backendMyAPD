require("dotenv/config");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const userController = require("./controller/userController");
const authController = require("./controller/authController");
const apdController = require("./controller/apdController");
const transactionController = require("./controller/transactionController");
const { verifyToken } = require("./middleware/authMiddleware");
const { checkRole } = require("./middleware/roleMiddleware");
const upload = require("./middleware/uploadMiddleware");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <-- TAMBAHKAN BARIS INI
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Routes (nanti kita tambah sini)
app.post("/api/login", upload.none(), authController.login);

// Routes users (Only Admin)
app.get("/api/users", verifyToken, checkRole(["admin"]), userController.getAllUsers);
app.get("/api/users/:id", verifyToken, checkRole(["admin"]), userController.getUserById);
app.post("/api/users", verifyToken, checkRole(["admin"]), userController.createUser);
app.put("/api/users/:id", verifyToken, checkRole(["admin"]), userController.updateUser);
app.delete("/api/users/:id", verifyToken, checkRole(["admin"]), userController.deleteUser);

// Routes APD (Admin for mutation, All for reading)
app.get("/api/apd", verifyToken, apdController.getAllApd);
app.get("/api/apd/:id", verifyToken, apdController.getApdById);
app.post("/api/apd", verifyToken, checkRole(["admin"]), apdController.createApd);
app.put("/api/apd/:id", verifyToken, checkRole(["admin"]), apdController.updateApd);
app.delete("/api/apd/:id", verifyToken, checkRole(["admin"]), apdController.deleteApd);

// Routes Transactions
// Karyawan can create reports
app.post("/api/transactions", verifyToken, checkRole(["karyawan"]), upload.single("foto"), transactionController.createTransaction);
// All roles can read (logic is filtered in controller so karyawan only sees theirs, mandor/admin sees all)
app.get("/api/transactions", verifyToken, transactionController.getAllTransactions);
// Only Admin can approve
app.put("/api/transactions/:id/status", verifyToken, checkRole(["admin"]), transactionController.updateTransactionStatus);


// Health check
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
// Trigger restart
