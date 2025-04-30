import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Instructor", // Default role
    password: "",
  });
  const navigate = useNavigate();

  // Steel Blue–inspired Facebook-style palette
  const colors = {
    steelBlue: "#4682B4",
    lightBlue: "#d0e7ff",
    paleBlue: "#eaf4ff",
    white: "#ffffff",
    darkText: "#1f2d3d",
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5009/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        navigate("/");
      } else {
        alert(result.message || "Error creating account. Please try again.");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div
      style={{
        backgroundColor: colors.steelBlue,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "30px",
      }}
    >
      {/* Signup form container */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: colors.paleBlue,
          padding: "40px",
          borderRadius: "10px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: colors.darkText, textAlign: "center", marginBottom: "20px" }}>
          Sign Up
        </h2>

        {/* First & Last Name */}
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleInputChange}
          required
          style={inputStyle(colors)}
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleInputChange}
          required
          style={inputStyle(colors)}
        />

        {/* Email & Phone */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          required
          style={inputStyle(colors)}
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleInputChange}
          style={inputStyle(colors)}
        />

        {/* Role selector */}
        <select
          name="role"
          value={formData.role}
          onChange={handleInputChange}
          required
          style={inputStyle(colors)}
        >
          <option value="Instructor">Instructor</option>
          <option value="Head of Department">Head of Department</option>
          <option value="Bookstore">Bookstore</option>
        </select>

        {/* Password */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          required
          style={inputStyle(colors)}
        />

        {/* Submit */}
        <button type="submit" style={buttonStyle(colors)}>
          Sign Up
        </button>
      </form>
    </div>
  );
};

// shared input styling
const inputStyle = (colors) => ({
  width: "100%",
  marginBottom: "15px",
  padding: "12px",
  borderRadius: "5px",
  border: `1px solid ${colors.darkText}20`, // slightly transparent border
  backgroundColor: colors.white,
  color: colors.darkText,
  fontSize: "15px",
});

// shared button styling
const buttonStyle = (colors) => ({
  width: "100%",
  padding: "12px",
  borderRadius: "5px",
  border: "none",
  backgroundColor: colors.steelBlue,
  color: colors.white,
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "10px",
});

export default Signup;
