const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root", // Update with your MySQL username
  password: "Zeynalli...2000", // Update with your MySQL password
  database: "textbook_adopt_mvsu", // Ensure this matches your schema name
});

module.exports = db;

db.getConnection()
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error("Database connection error:", err));
