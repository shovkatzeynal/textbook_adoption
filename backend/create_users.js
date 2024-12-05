const bcrypt = require("bcrypt");
const db = require("./db"); // Ensure this points to your database connection file

async function createUsers() {
  const users = [
    { firstName: "Marcus", lastName: "Golden", email: "marcus.golden@example.com", phone: "6015551003", role: "Instructor", password: "marcus123" },
    { firstName: "Wu", lastName: "Xiaoqin", email: "xiaoqin.wu@example.com", phone: "6015551007", role: "Instructor", password: "wu123" },
    { firstName: "Jane", lastName: "Smith", email: "hod@example.com", phone: "9876543210", role: "Head of Department", password: "jane123" },
    { firstName: "Admin", lastName: "Bookstore", email: "bookstore@example.com", phone: null, role: "Bookstore", password: "admin123" },
    { firstName: "Darrell", lastName: "James", email: "darrell.james@example.com", phone: "6015551001", role: "Instructor", password: "darrell123" },
    { firstName: "Jearline", lastName: "Bryant", email: "jearline.bryant@example.com", phone: "6015551002", role: "Instructor", password: "jearline123" },
    { firstName: "Latonya", lastName: "Garner-Jackson", email: "latonya.garner@example.com", phone: "6015551004", role: "Instructor", password: "latonya123" },
    { firstName: "Christopher", lastName: "Lanclos", email: "christopher.lanclos@example.com", phone: "6015551005", role: "Instructor", password: "christopher123" },
    { firstName: "Khaled", lastName: "Sabahein", email: "khaled.sabahein@example.com", phone: "6015551006", role: "Instructor", password: "khaled123" },
  ];

  try {
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const query = `
        INSERT INTO users (first_name, last_name, email, phone, role, password_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await db.execute(query, [user.firstName, user.lastName, user.email, user.phone, user.role, hashedPassword]);

      console.log(`User ${user.firstName} ${user.lastName} created successfully.`);
    }
    console.log("All users created successfully!");
  } catch (error) {
    console.error("Error creating users:", error);
  }
}

createUsers();
