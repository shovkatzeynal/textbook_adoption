const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password", // Change as per your setup
  database: "textbook_adopt_mvsu",
});

module.exports = pool.promise();
