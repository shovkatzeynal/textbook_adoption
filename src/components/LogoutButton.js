// src/components/LogoutButton.js

import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "8px 16px",
        background: "#dc3545",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
