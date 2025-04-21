import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

console.log("Login component loaded!");
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5009/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("userId", result.userId);
        localStorage.setItem("role", result.role); // Store role in local storage

        // Navigate based on role
        switch (result.role) {
          case "Instructor":
            navigate("/instructor");
            break;
          case "Head of Department":
            navigate("/hod");
            break;
          case "Bookstore":
            navigate("/bookstore");
            break;
          default:
            alert("Unknown role. Please contact admin.");
        }
      } else {
        alert(result.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("Login failed. Please check your network and try again.");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit">Login</button>
      </form>
      <div>
        <p>Don't have an account?</p>
        {/* Add navigation to the signup page */}
        <button onClick={() => navigate("/signup")}>Sign Up</button>
      </div>
    </div>
  );
};

export default Login;
