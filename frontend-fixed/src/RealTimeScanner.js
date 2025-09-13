import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./RealTimeScanner.css";

export default function RealTimeScanner() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("Waiting for scan...");
  const [faces, setFaces] = useState([]);
  const [glowType, setGlowType] = useState(""); // "", "success", "fail"
  const [isScanning, setIsScanning] = useState(true);

  /** Convert a webcam screenshot (dataURL) to Blob */
  const dataURLtoBlob = (dataURL) => {
    const [meta, base64] = dataURL.split(",");
    const mime = meta.match(/:(.*?);/)[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  /** Glow animation helper */
  const triggerGlow = (type) => {
    setGlowType(type);
    setTimeout(() => setGlowType(""), 2000);
  };

  /** Send frame to backend */
  const captureAndSend = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const blob = dataURLtoBlob(imageSrc);
    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    try {
      const { data } = await axios.post(
        "http://localhost:8080/api/face/recognize",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const msg = data.message || "❌ No response";
      setMessage(msg);
      setFaces(data.faces || []);

      if (msg.toLowerCase().includes("marked") || msg.includes("✅")) {
        triggerGlow("success");
      } else if (
        msg.toLowerCase().includes("no recog") ||
        msg.toLowerCase().includes("unknown") ||
        msg.includes("❌")
      ) {
        triggerGlow("fail");
      }
    } catch (err) {
      console.error("🚨 Backend error:", err);
      setMessage("⚠️ Error connecting to backend");
      triggerGlow("fail");
    }
  }, []);

  /** Smooth scanning loop using requestAnimationFrame */
  useEffect(() => {
    let timer;
    const scan = () => {
      captureAndSend();
      timer = setTimeout(() => requestAnimationFrame(scan), 3000); // every 3s
    };
    if (isScanning) scan();
    return () => clearTimeout(timer);
  }, [captureAndSend, isScanning]);

  /** Draw detection boxes */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    faces.forEach((face) => {
      const pad = 4; // tighten box slightly
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = face.identity !== "Unknown" ? "lime" : "red";
      ctx.rect(
        face.x + pad,
        face.y + pad,
        face.width - pad * 2,
        face.height - pad * 2
      );
      ctx.stroke();

      // Gradient label background
      const gradient = ctx.createLinearGradient(0, 0, 120, 0);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(1, "#001f54");
      ctx.fillStyle = gradient;
      ctx.font = "16px Poppins, sans-serif";
      ctx.fillText(
        face.identity !== "Unknown"
          ? `${face.identity} (${Number(face.confidence ?? face.distance ?? 0).toFixed(1)})`
          : "Unknown",
        face.x + pad,
        face.y - 6
      );
    });
  }, [faces]);

  return (
    <div className="scanner-container">
      <div className="scanner-card">
        <h2>👁️ Real-Time Face Scanner</h2>
        <p className="subtitle">Scan faces and recognize students instantly</p>
        <p className="scan-message">{message}</p>

        <div
          className={`webcam-wrapper ${
            glowType === "success"
              ? "success-glow"
              : glowType === "fail"
              ? "fail-glow"
              : ""
          }`}
        >
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={640}
            height={480}
            videoConstraints={{ facingMode: "user" }}
          />
          <canvas ref={canvasRef} width={640} height={480} className="overlay" />
        </div>

        {faces.length > 0 && (
          <div className="faces-list">
            {faces.map((face, idx) => (
              <div key={idx} className="face-card">
                <strong>
                  Face #{idx + 1}: {face.identity}{" "}
                  {face.confidence &&
                    `(${Number(face.confidence).toFixed(1)})`}
                </strong>
                {face.alternatives?.length > 0 && (
                  <ul>
                    {face.alternatives.map((alt, i) => (
                      <li key={i}>
                        {i + 1}. {alt.name} (Roll: {alt.rollNo}, conf:{" "}
                        {Number(alt.confidence).toFixed(1)})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          className="toggle-scan-btn"
          onClick={() => setIsScanning((s) => !s)}
        >
          {isScanning ? "⏸ Pause Scanning" : "▶️ Resume Scanning"}
        </button>
      </div>
    </div>
  );
}
