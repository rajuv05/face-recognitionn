import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css"; // new file (separate from Auth.css)

function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2>👋 Welcome, {username}!</h2>
        <p className="subtitle">Face Recognition Attendance System</p>

        <div className="button-grid">
          <button onClick={() => navigate("/attendance-list")}>
            📊 View Attendance
          </button>

          <button onClick={() => navigate("/attendance-dashboard")}>
            📅 Attendance Dashboard
          </button>

          <button onClick={() => navigate("/scanner")}>
            🎥 Open Scanner
          </button>

          <button onClick={() => navigate("/add-samples")}>
            📸 Add Face Samples
          </button>

          <button className="logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
