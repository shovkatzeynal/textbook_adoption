const express = require("express"); // Import Express
const bcrypt = require("bcrypt"); // Import bcrypt for password hashing
const cors = require("cors"); // Import CORS middleware
const db = require("./db"); // Import the database connection

// Initialize the app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Allow cross-origin requests

// Start the server
const PORT = 5009; // Define the port you want to use
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Signup Route
app.post("/api/signup", async (req, res) => {
  const { firstName, lastName, email, phone, role, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user into the database
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
  console.log("Received login request for email:", email); // Debugging log

  try {
    // Query the database for the user
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.execute(query, [email]);
    console.log("Database query result:", rows); // Debugging log

    if (rows.length === 0) {
      console.log("User not found in database."); // Debugging log
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    console.log("User from database:", user); // Debugging log

    // Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log("Password validation result:", isPasswordValid); // Debugging log

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
