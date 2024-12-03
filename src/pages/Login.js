import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Sending login request with email:", email, "password:", password); // Debugging log
  
    try {
      const response = await fetch("http://localhost:5009/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const result = await response.json();
      console.log("Login response from server:", result); // Debugging log
  
      if (response.ok) {
        if (result.role === "Instructor") navigate("/instructor");
        else if (result.role === "HoD") navigate("/hod");
        else if (result.role === "Bookstore") navigate("/bookstore");
      } else {
        alert(result.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("A network or server error occurred. Please try again later.");
    }
  };  

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
        <p>
          Don't have an account? <a href="/signup">Sign up here</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
