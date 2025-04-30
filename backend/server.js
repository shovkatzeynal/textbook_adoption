require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./routes"); // Import your routes

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Use all API routes
app.use("/", routes);

// Start the server
const PORT = process.env.PORT || 5009;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
