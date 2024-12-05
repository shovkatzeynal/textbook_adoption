require("dotenv").config(); // Load environment variables
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const db = require("./db");
const rateLimit = require("express-rate-limit");

// Initialize the app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Start the server
const PORT = process.env.PORT || 5009;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Signup Route
app.post("/api/signup", async (req, res) => {
  const { firstName, lastName, email, phone, role, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

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
// Login Route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Received login request for email:", email);

  try {
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.execute(query, [email]);

    if (rows.length === 0) {
      console.log("User not found in database.");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    console.log("User from database:", user);

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Include userId in the response
    res.status(200).json({
      message: "Login successful",
      userId: user.user_id, // Include user_id in the response
      role: user.role,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// Fetch courses for a specific instructor
app.get("/api/courses", async (req, res) => {
  const userId = req.query.userId;

  try {
    const query = `
      SELECT course_number, course_name, term
      FROM courses
      WHERE instructor_id = ?
    `;
    const [rows] = await db.execute(query, [userId]);

    if (rows.length === 0) {
      return res.status(200).json({ message: "No courses assigned to you." });
    }

    res.status(200).json({ courses: rows });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Failed to fetch courses." });
  }
});