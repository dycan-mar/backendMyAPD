require("dotenv/config");
const express = require("express");
const cors = require("cors");

const app = express();
const userController = require("./controller/userController");

app.use(cors());
app.use(express.json());

// Routes (nanti kita tambah sini)

// Routes users
app.get("/api/users", userController.getAllUsers);
app.get("/api/users/:id", userController.getUserById);
app.post("/api/users", userController.createUser);
app.put("/api/users/:id", userController.updateUser);
app.delete("/api/users/:id", userController.deleteUser);


// Health check
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
