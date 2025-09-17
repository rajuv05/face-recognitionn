import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import "./Auth.css";

function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!usernameOrEmail || !password) {
      toast.error("All fields are required ❌");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      if (res.ok) {
        toast.success("✅ Login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        const errMsg = await res.text();
        toast.error(errMsg || "❌ Invalid username or password!");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("⚠️ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Neon BG like signup */}
      <div className="neon-bg"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="auth-card"
      >
        <h2 className="auth-title">Login</h2>
        <p className="auth-subtitle">Welcome back</p>

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

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="auth-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Login"}
        </motion.button>

        <p className="auth-link">
          Don’t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </motion.div>

      {/* Custom Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(17, 25, 40, 0.8)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(12px)",
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "0.95rem",
            boxShadow: "0 0 20px rgba(0, 247, 255, 0.6)",
          },
          success: {
            iconTheme: {
              primary: "#00f7ff",
              secondary: "#0f172a",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff006e",
              secondary: "#0f172a",
            },
          },
        }}
      />
    </div>
  );
}

export default Login;
