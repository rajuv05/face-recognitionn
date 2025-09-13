import React from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, BarChart3, Camera, UserPlus, LogOut } from "lucide-react";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const ActionButton = ({ onClick, icon: Icon, title }) => (
    <button className="action-btn" onClick={onClick}>
      <Icon className="action-icon" />
      <span>{title}</span>
    </button>
  );

  return (
    <div className="dashboard-root">
      <div className="dashboard-card">
        <h2 className="welcome-text">👋 Welcome Admin</h2>
        <p className="subtitle">Face Recognition Attendance System</p>

        <div className="actions-grid">
          <ActionButton onClick={() => navigate("/attendance-list")} icon={BarChart3} title="View Attendance" />
          <ActionButton onClick={() => navigate("/attendance-dashboard")} icon={CalendarDays} title="Dashboard" />
          <ActionButton onClick={() => navigate("/scanner")} icon={Camera} title="Open Scanner" />
          <ActionButton onClick={() => navigate("/add-samples")} icon={UserPlus} title="Add Face Samples" />
        </div>

        <div className="logout-container">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut className="logout-icon" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
