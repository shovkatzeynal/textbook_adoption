const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for frontend-backend communication

// Signup Route
app.post("/api/signup", async (req, res) => {
  const { firstName, lastName, email, phone, role, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const query = `
      INSERT INTO users (first_name, last_name, email, phone, role, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.execute(query, [firstName, lastName, email, phone, role, hashedPassword]);

    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ message: "Email already exists." });
    } else {
      res.status(500).json({ message: "Error creating account. Please try again." });
    }
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists in the database
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.execute(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // If login is successful, return user details
    res.status(200).json({
      message: "Login successful",
      role: user.role,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// Start the server
app.listen(5009, () => {
  console.log("Server is running on http://localhost:5009");
});
