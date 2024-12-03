const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db"); // Ensure db.js is correctly configured

const app = express();
app.use(express.json());

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

// Start the server
app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
