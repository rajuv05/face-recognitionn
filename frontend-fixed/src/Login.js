import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Login() {
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usernameOrEmail, password }), // ✅ matches backend
            });

            if (res.ok) {
                // You could also parse user info here if backend returns it
                // const user = await res.json();
                alert("Login successful!");
                navigate("/dashboard");
            } else {
                const errMsg = await res.text();
                alert(errMsg || "Invalid username or password!");
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Login</h2>
                <input
                    className="auth-input"
                    type="text"
                    placeholder="Username or Email"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                />
                <input
                    className="auth-input"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button className="auth-button" onClick={handleLogin}>
                    Login
                </button>
                <div className="auth-link">
                    Don’t have an account? <Link to="/signup">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
