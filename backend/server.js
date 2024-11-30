const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();
app.use(express.json());

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
    await db.query(query, [firstName, lastName, email, phone, role, hashedPassword]);

    res.status(201).send("User created successfully!");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Error creating account. Please try again.");
  }
});
