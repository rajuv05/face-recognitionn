import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import "./Signup.css";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!username || !email || !password) {
      toast.error("All fields are required ❌");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email! 📧");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        }
      );

      if (res.ok) {
        toast.success("Signup successful! 🎉 Redirecting...");
        setTimeout(() => navigate("/"), 2000);
      } else {
        const errMsg = await res.text();
        toast.error(errMsg || "Signup failed ❌");
      }
    } catch (err) {
      toast.error("Something went wrong ⚠️");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Neon Particles BG */}
      <div className="neon-bg"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="signup-card"
      >
        <h2 className="signup-title">Create Account</h2>
        <p className="signup-subtitle">Welcome</p>

        <input
          className="signup-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="signup-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="signup-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="signup-button"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign Up"}
        </motion.button>

        <p className="signup-link">
          Already have an account? <Link to="/">Login</Link>
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

export default Signup;
