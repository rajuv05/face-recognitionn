import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import "./RealTimeScanner.css";

export default function RealTimeScanner() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("Waiting for scan...");
  const [faces, setFaces] = useState([]);
  const [glowType, setGlowType] = useState(""); // "", "success", "fail"

  function dataURLtoBlob(dataURL) {
    const byteString = atob(dataURL.split(",")[1]);
    const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  const captureAndSend = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const blob = dataURLtoBlob(imageSrc);
    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    try {
      const res = await axios.post(
        "http://localhost:8080/api/face/recognize",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const msg = res.data.message || "❌ No response";
      setMessage(msg);
      setFaces(res.data.faces || []);

      // ✅ Success case
      if (msg.toLowerCase().includes("marked") || msg.includes("✅")) {
        setGlowType("success");
        setTimeout(() => setGlowType(""), 2000);
      }
      // ❌ Failure case
      else if (
        msg.toLowerCase().includes("no recog") ||
        msg.toLowerCase().includes("unknown") ||
        msg.includes("❌")
      ) {
        setGlowType("fail");
        setTimeout(() => setGlowType(""), 2000);
      }
    } catch (err) {
      console.error("🚨 Error calling backend:", err);
      setMessage("⚠️ Error connecting to backend");
      setGlowType("fail");
      setTimeout(() => setGlowType(""), 2000);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      captureAndSend();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    faces.forEach((face) => {
      context.beginPath();
      context.lineWidth = "3";
      context.strokeStyle = face.identity !== "Unknown" ? "lime" : "red";
      context.rect(face.x, face.y, face.width, face.height);
      context.stroke();

      context.fillStyle = "yellow";
      context.font = "16px Poppins, sans-serif";
      const label =
        face.identity && face.identity !== "Unknown"
          ? `${face.identity} (${face.confidence?.toFixed?.(1) ?? "?"})`
          : "Unknown";
      context.fillText(label, face.x, face.y - 5);
    });
  }, [faces]);

  return (
    <div className="scanner-container">
      <div className="scanner-card">
        <h2>👁️ Real-Time Face Scanner</h2>
        <p className="subtitle">Scan faces and recognize students instantly</p>

        {/* ✅ Always visible message */}
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
                  {face.confidence && `(${face.confidence.toFixed(1)})`}
                </strong>
                {face.alternatives && face.alternatives.length > 0 && (
                  <ul>
                    {face.alternatives.map((alt, i) => (
                      <li key={i}>
                        {i + 1}. {alt.name} (Roll: {alt.rollNo}, conf:{" "}
                        {alt.confidence.toFixed(1)})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
