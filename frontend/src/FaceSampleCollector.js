import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { motion } from "framer-motion";
import { Camera, Save, User, Hash, RefreshCcw } from "lucide-react";
import "./FaceSampleCollector.css";

function FaceSampleCollector() {
  const webcamRef = useRef(null);
  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [captured, setCaptured] = useState([]);
  const [saving, setSaving] = useState(false);
  const [facingMode, setFacingMode] = useState("user");

  /** Convert base64 → Blob */
  const dataURLtoBlob = (dataURL) => {
    const [meta, base64] = dataURL.split(",");
    const mime = meta.match(/:(.*?);/)[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  /** Capture frame from webcam */
  const captureImage = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const sampleCount = captured.length + 1;
    const filename = `${rollNo}_${name}_${String(sampleCount).padStart(2, "0")}.jpg`;

    setCaptured((prev) => [...prev, { image: imageSrc, filename }]);
  };

  /** Upload all captured samples */
  const saveSamples = async () => {
    if (!rollNo || !name) {
      alert("Please enter Roll No and Name first!");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("rollNo", rollNo);
      formData.append("name", name);

      captured.forEach((sample) => {
        const blob = dataURLtoBlob(sample.image);
        formData.append("files", blob, sample.filename);
      });

      await fetch(`${process.env.REACT_APP_API_URL}/face/register`, {
        method: "POST",
        body: formData,
      });

      alert("✅ Samples uploaded & student registered!");
      setCaptured([]);
    } catch (error) {
      console.error("Error while saving samples:", error);
      alert("❌ Failed to save samples.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="collector-root">
      {/* Neon Glow */}
      <div className="neon-bg"></div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="collector-card"
      >
        <h2 className="welcome-text">🎓 Face Sample Collector</h2>
        <p className="subtitle">Capture, align & upload face samples</p>

        {/* Roll No + Name */}
        <div className="input-row">
          <div className="input-wrapper">
            <Hash className="input-icon" />
            <input
              type="text"
              placeholder="Roll No"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
          </div>
          <div className="input-wrapper">
            <User className="input-icon" />
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* Camera Switch */}
        <div className="input-row">
          <label className="camera-label">Camera:</label>
          <select
            className="camera-select"
            value={facingMode}
            onChange={(e) => setFacingMode(e.target.value)}
          >
            <option value="user">Front</option>
            <option value="environment">Rear</option>
          </select>
        </div>

        {/* Webcam */}
        <div className="webcam-wrapper">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={420}
            height={300}
            videoConstraints={{ facingMode }}
          />
        </div>

        {/* Buttons */}
        <div className="button-row">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={captureImage}
            className="action-btn"
          >
            <Camera className="btn-icon" /> Capture
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={saveSamples}
            disabled={captured.length === 0 || saving}
            className="action-btn"
          >
            <Save className="btn-icon" />
            {saving ? "Saving..." : "Save & Register"}
          </motion.button>
        </div>

        {/* Preview */}
        {captured.length > 0 && (
          <div className="preview-grid">
            {captured.map((sample, idx) => (
              <div key={idx} className="preview-item">
                <img src={sample.image} alt={`sample-${idx}`} />
                <span>{sample.filename}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default FaceSampleCollector;
