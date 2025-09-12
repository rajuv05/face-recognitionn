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

    const handleViewAttendance = () => {
        navigate("/attendance-list");
    };

    const handleOpenScanner = () => {
        navigate("/scanner");
    };

    const handleAttendanceDashboard = () => {
        navigate("/attendance-dashboard");
    };

    const handleAddSamples = () => {
        navigate("/add-samples"); // 👈 new route for FaceSampleCollector
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Welcome, {username}! 👋</h2>
                <p>Face Recognition Attendance Dashboard</p>

                <div
                    style={{
                        marginTop: "1.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                    }}
                >
                    <button className="auth-button" onClick={handleViewAttendance}>
                        📊 View Attendance
                    </button>

                    <button className="auth-button" onClick={handleAttendanceDashboard}>
                        📅 Attendance Dashboard
                    </button>

                    <button className="auth-button" onClick={handleOpenScanner}>
                        🎥 Open Scanner
                    </button>

                    <button className="auth-button" onClick={handleAddSamples}>
                        📸 Add Face Samples
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
