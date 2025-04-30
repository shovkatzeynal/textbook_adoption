const express = require("express");
const db = require("./db");
const bcrypt = require("bcrypt");

const router = express.Router();

// ========== USER AUTHENTICATION ROUTES ==========

// Signup
router.post("/api/signup", async (req, res) => {
  const { firstName, lastName, email, phone, role, password } = req.body;

  try {
    const userId = Math.floor(100000000 + Math.random() * 900000000);
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (user_id, first_name, last_name, email, phone, role, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await db.execute(query, [userId, firstName, lastName, email, phone, role, hashedPassword]);

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

// Login
router.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.execute(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      message: "Login successful",
      userId: user.user_id,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ========== COURSE AND TEXTBOOK ROUTES ==========

// Get all courses for an instructor
// In routes.js
router.get("/api/courses", async (req, res) => {
  const userId = req.query.userId;

  try {
    const query = `
      SELECT course_id, course_number, course_name, term, hod_id
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


// Get textbook for a course
router.get("/api/textbooks/:courseId", async (req, res) => {
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

    const data = {
      course_id: rows[0].course_id,
      course_number: rows[0].course_number || "",
      course_name: rows[0].course_name || "",
      term: rows[0].term || "Unknown Term",
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

// Create textbook manually (optional)
router.post("/api/textbooks", async (req, res) => {
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
    res.status(500).json({ message: "Failed to create textbook form." });
  }
});

// ========== FORM SUBMISSION AND APPROVAL ROUTES ==========

// Instructor submit form
// Find HoD id dynamically when instructor submits
// ========== FORM SUBMISSION AND APPROVAL ROUTES ==========

router.post("/api/submit-form", async (req, res) => {
  const {
    courseId,
    publisher,
    title,
    author,
    isbn,
    edition,
    quantity,
    otherMaterials,
    requestedBy,
  } = req.body;

  try {
    // Step 1: Get the Head of Department (HoD) for the course
    const [courseRows] = await db.execute(
      "SELECT hod_id FROM courses WHERE course_id = ?",
      [courseId]
    );

    if (courseRows.length === 0) {
      return res.status(400).json({ message: "Course not found." });
    }

    const hodId = courseRows[0].hod_id;

    // Step 2: Insert or update the textbook for the course
    await db.execute(
      `INSERT INTO textbooks (course_id, publisher, title, author, isbn, edition, quantity, other_materials, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
       ON DUPLICATE KEY UPDATE
         publisher = VALUES(publisher),
         title = VALUES(title),
         author = VALUES(author),
         isbn = VALUES(isbn),
         edition = VALUES(edition),
         quantity = VALUES(quantity),
         other_materials = VALUES(other_materials),
         status = 'Pending'`,
      [courseId, publisher, title, author, isbn, edition, quantity, otherMaterials]
    );

    // Step 3: Fetch the inserted/updated textbook_id
    const [textbookRows] = await db.execute(
      "SELECT textbook_id FROM textbooks WHERE course_id = ?",
      [courseId]
    );

    if (textbookRows.length === 0) {
      return res.status(500).json({ message: "Failed to retrieve textbook after insert." });
    }

    const textbookId = textbookRows[0].textbook_id;

    // Step 4: Insert the request
    await db.execute(
      "INSERT INTO requests (course_id, textbook_id, requested_by, approved_by, status) VALUES (?, ?, ?, ?, 'Pending')",
      [courseId, textbookId, requestedBy, hodId]
    );

    res.status(200).json({ message: "Form submitted successfully!" });
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({
      message: "Failed to submit form.",
      error: error.message,
    });
  }
});



// HoD fetch pending forms
// 
router.get("/api/hod-forms", async (req, res) => {
  const { hodId } = req.query;
  console.log("Fetching HoD forms for:", hodId);

  const sql = `
    SELECT 
      r.request_id,
      r.created_at,
      r.status,
      t.other_materials AS otherMaterials,
      t.title,
      t.author,
      t.publisher,
      t.isbn,
      t.edition,
      t.quantity,
      c.course_name,
      c.term,
      u.first_name,
      u.last_name
    FROM requests r
    JOIN textbooks t ON r.textbook_id = t.textbook_id
    JOIN courses c ON r.course_id = c.course_id
    JOIN users u ON r.requested_by = u.user_id
    WHERE r.status = 'Pending' AND r.approved_by = ?
  `;

  try {
    const [results] = await db.execute(sql, [hodId]);

    console.log("Fetched forms count:", results.length);

    const forms = results.map(row => ({
      request_id: row.request_id,
      created_at: row.created_at,
      status: row.status,
      otherMaterials: row.otherMaterials,
      title: row.title,
      author: row.author,
      publisher: row.publisher,
      isbn: row.isbn,
      edition: row.edition,
      quantity: row.quantity,
      course_name: row.course_name,
      term: row.term,
      instructor_name: `${row.first_name} ${row.last_name}`
    }));

    res.json({ forms });
  } catch (error) {
    console.error("Error fetching HoD forms:", error);
    res.status(500).json({ message: "Server error." });
  }
});



// HoD approve form
router.patch("/api/approve-form/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      UPDATE requests
      SET status = 'Approved'
      WHERE request_id = ?
    `;
    await db.execute(query, [id]);

    res.status(200).json({ message: "Form approved successfully!" });
  } catch (error) {
    console.error("Error approving form:", error);
    res.status(500).json({ message: "Failed to approve form." });
  }
});

// HoD reject form
router.patch("/api/reject-form/:id", async (req, res) => {
  const { id } = req.params;
  const { rejectionComments } = req.body;

  if (!rejectionComments || rejectionComments.trim() === "") {
    return res.status(400).json({ message: "Rejection reason is required." });
  }

  try {
    const query = `
      UPDATE requests
      SET status = 'Rejected', rejection_comments = ?
      WHERE request_id = ?
    `;
    await db.execute(query, [rejectionComments, id]);

    res.status(200).json({ message: "Form rejected successfully!" });
  } catch (error) {
    console.error("Error rejecting form:", error);
    res.status(500).json({ message: "Failed to reject form." });
  }
});

module.exports = router;
