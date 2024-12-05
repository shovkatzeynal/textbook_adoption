require("dotenv").config(); // Load environment variables
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const db = require("./db");

// Initialize the app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

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

    res.status(200).json({
      message: "Login successful",
      userId: user.user_id,
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
      SELECT course_id, course_number, course_name, term
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

// Fetch existing textbooks for a course
app.get("/api/textbooks/:courseId", async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const query = `
      SELECT * FROM textbooks
      WHERE course_id = ?
    `;
    const [rows] = await db.execute(query, [courseId]);

    if (rows.length === 0) {
      return res.status(200).json({ message: "No textbooks found for this course." });
    }

    res.status(200).json({ textbooks: rows });
  } catch (error) {
    console.error("Error fetching textbooks:", error);
    res.status(500).json({ message: "Failed to fetch textbooks." });
  }
});

// Create or reuse a textbook adoption form
app.post("/api/textbooks", async (req, res) => {
  const { courseId, publisher, title, author, isbn, edition, quantity, otherMaterials } = req.body;

  try {
    const query = `
      INSERT INTO textbooks (course_id, publisher, title, author, isbn, edition, quantity, other_materials)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.execute(query, [courseId, publisher, title, author, isbn, edition, quantity, otherMaterials]);

    res.status(201).json({ message: "Textbook form created successfully!" });
  } catch (error) {
    console.error("Error creating textbook form:", error);
    res.status(500).json({ message: "Failed to create textbook form. Please try again later." });
  }
});

// Fetch textbook for a specific course
app.get("/api/textbooks/:courseId", async (req, res) => {
  const courseId = req.params.courseId;

  try {
    const query = `
      SELECT 
        c.course_id, c.course_number, c.course_name, c.term, 
        t.publisher, t.title, t.author, t.isbn, t.edition, t.quantity, t.other_materials
      FROM courses c
      LEFT JOIN textbooks t ON c.course_id = t.course_id
      WHERE c.course_id = ?
    `;
    const [rows] = await db.execute(query, [courseId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No course or textbook data found." });
    }

    // Safeguard missing fields with defaults
    const data = {
      course_id: rows[0].course_id,
      course_number: rows[0].course_number || "",
      course_name: rows[0].course_name || "",
      term: rows[0].term || "Unknown Term", // Default to prevent errors
      publisher: rows[0].publisher || "",
      title: rows[0].title || "",
      author: rows[0].author || "",
      isbn: rows[0].isbn || "",
      edition: rows[0].edition || "",
      quantity: rows[0].quantity || 1,
      other_materials: rows[0].other_materials || "",
    };

    res.status(200).json({ course: data });
  } catch (error) {
    console.error("Error fetching course and textbook details:", error);
    res.status(500).json({ message: "Failed to fetch course and textbook details." });
  }
});



