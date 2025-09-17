import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="action-btn"
    >
      <Icon className="action-icon" />
      <span>{title}</span>
    </motion.button>
  );

  return (
    <div className="dashboard-root">
      {/* Neon Particles / Glow Background */}
      <div className="neon-bg"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="dashboard-card"
      >
        <h2 className="welcome-text">👋 Welcome, {username}</h2>
        <p className="subtitle">Face Recognition Attendance System</p>

        <div className="actions-grid">
          <ActionButton
            onClick={() => navigate("/attendance-list")}
            icon={BarChart3}
            title="View Attendance"
          />
          <ActionButton
            onClick={() => navigate("/attendance-dashboard")}
            icon={CalendarDays}
            title="Dashboard"
          />
          <ActionButton
            onClick={() => navigate("/scanner")}
            icon={Camera}
            title="Open Scanner"
          />
          <ActionButton
            onClick={() => navigate("/add-samples")}
            icon={UserPlus}
            title="Add Face Samples"
          />
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="logout-container"
        >
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut className="logout-icon" /> Logout
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
