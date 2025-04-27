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
        localStorage.setItem("role", result.role);
        localStorage.setItem("fullName", `${result.firstName} ${result.lastName}`);

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
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.button}>Login</button>
        </form>

        <p style={styles.signupText}>
          Don't have an account?{" "}
          <button onClick={() => navigate("/signup")} style={styles.signupButton}>
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

const forestGreen = "#228B22"; // Forest Green color

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    textAlign: "center",
    marginBottom: "25px",
    color: forestGreen,
    fontWeight: "bold",
    fontSize: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    padding: "10px",
    marginBottom: "20px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    backgroundColor: forestGreen,
    color: "white",
    fontSize: "16px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  },
  signupText: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "14px",
    color: "#555",
  },
  signupButton: {
    background: "none",
    border: "none",
    color: forestGreen,
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "14px",
    fontWeight: "bold",
  },
};

export default Login;
