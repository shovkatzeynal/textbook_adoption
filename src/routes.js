import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Instructor from "./pages/Instructor";
import HoD from "./pages/HoD";
import Bookstore from "./pages/Bookstore";

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/instructor" element={<Instructor />} />
      <Route path="/hod" element={<HoD />} />
      <Route path="/bookstore" element={<Bookstore />} />
    </Routes>
  </Router>
);

export default AppRoutes;
