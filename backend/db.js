// const mysql = require("mysql2/promise");

// const db = mysql.createPool({
//   host: "localhost",
//   user: "root", // Replace with your MySQL username
//   password: "Zeynalli...2000", // Replace with your MySQL password
//   database: "textbook_adopt_mvsu", // Replace with your database name
// });

// module.exports = db;

// // Test the database connection
// db.getConnection()
//   .then(() => console.log("Connected to database"))
//   .catch((err) => console.error("Database connection error:", err));


  const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root", 
  password: "Zeynalli...2000", 
  database: "textbook_adopt_mvsu", 
});

// Test database connection once when file loads
(async () => {
  try {
    await db.getConnection();
    console.log("Connected to database");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1); // Stop server if database is not connected
  }
})();

module.exports = db;
