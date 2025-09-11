import React from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Reuse styles or create Dashboard.css

function Dashboard() {
    const navigate = useNavigate();
    const username = localStorage.getItem("username") || "User"; // Get from localStorage (set after login)

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    const handleMarkAttendance = () => {
        navigate("/mark-attendance");
    };

    const handleViewAttendance = () => {
        navigate("/attendance-list");
    };

    const handleOpenScanner = () => {       // 👈 NEW
        navigate("/scanner");               // 👈 navigate to scanner route
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Welcome, {username}! 👋</h2>
                <p>Face Recognition Attendance Dashboard</p>

                <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <button className="auth-button" onClick={handleMarkAttendance}>
                        📸 Mark Attendance
                    </button>

                    <button className="auth-button" onClick={handleViewAttendance}>
                        📊 View Attendance
                    </button>

                    <button className="auth-button" onClick={handleOpenScanner}>   {/* 👈 NEW button */}
                        🎥 Open Scanner
                    </button>

                    <button className="auth-button" onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
