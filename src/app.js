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
const upload = require("./middleware/uploadMiddleware");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Routes (nanti kita tambah sini)
app.post("/api/login", authController.login);

// Routes users
app.get("/api/users", verifyToken, userController.getAllUsers);
app.get("/api/users/:id", verifyToken, userController.getUserById);
app.post("/api/users", verifyToken, userController.createUser);
app.put("/api/users/:id", verifyToken, userController.updateUser);
app.delete("/api/users/:id", verifyToken, userController.deleteUser);

// Routes APD
app.get("/api/apd", verifyToken, apdController.getAllApd);
app.get("/api/apd/:id", verifyToken, apdController.getApdById);
app.post("/api/apd", verifyToken, apdController.createApd);
app.put("/api/apd/:id", verifyToken, apdController.updateApd);
app.delete("/api/apd/:id", verifyToken, apdController.deleteApd);

// Routes Transactions
app.post("/api/transactions", verifyToken, upload.single("foto"), transactionController.createTransaction);


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
