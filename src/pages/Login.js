import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const mockUsers = [
    { email: "instructor@example.com", role: "Instructor" },
    { email: "hod@example.com", role: "HoD" },
    { email: "bookstore@example.com", role: "Bookstore" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = mockUsers.find((u) => u.email === email);
    if (user) {
      if (user.role === "Instructor") navigate("/instructor");
      else if (user.role === "HoD") navigate("/hod");
      else if (user.role === "Bookstore") navigate("/bookstore");
    } else {
      alert("Invalid email or password");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
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
        <button type="submit">Login</button>
        <p>
          Don't have an account? <a href="/signup">Sign up here</a>
        </p>
      </form>
    </div>
  );
  
};

export default Login;
