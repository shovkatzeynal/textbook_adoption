const express = require("express");
const db = require("./db");
const router = express.Router();

// Example API: Get all users
router.get("/users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
