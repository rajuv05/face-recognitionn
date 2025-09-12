import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

export default function RealTimeScanner() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("Waiting for scan...");
  const [faces, setFaces] = useState([]);

  // Convert base64 → Blob
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

  // Capture frame & send to backend
  const captureAndSend = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      console.log("⚠️ No image captured from webcam");
      return;
    }

    const blob = dataURLtoBlob(imageSrc);
    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    try {
      const res = await axios.post(
        "http://localhost:8080/api/face/recognize",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("📥 Backend response:", res.data);

      setMessage(res.data.message || "❌ No response");
      setFaces(res.data.faces || []);
    } catch (err) {
      console.error("🚨 Error calling backend:", err);
      setMessage("⚠️ Error connecting to backend");
    }
  };

  // 🔄 Auto scan every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      captureAndSend();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 🎨 Draw bounding boxes
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

      // Main label
      context.fillStyle = "yellow";
      context.font = "16px Arial";
      const label =
        face.identity && face.identity !== "Unknown"
          ? `${face.identity} (${face.confidence?.toFixed?.(1) ?? "?"})`
          : "Unknown";
      context.fillText(label, face.x, face.y - 5);
    });
  }, [faces]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Webcam */}
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={640}
        height={480}
        videoConstraints={{ facingMode: "user" }}
        style={{ borderRadius: "8px" }}
      />

      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          borderRadius: "8px",
        }}
      />

      {/* Backend message */}
      <p style={{ textAlign: "center", marginTop: "10px", fontWeight: "bold" }}>
        {message}
      </p>

      {/* 🔎 Show alternative matches */}
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        {faces.map((face, idx) => (
          <div
            key={idx}
            style={{
              margin: "10px auto",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              width: "60%",
              background: "#f9f9f9",
            }}
          >
            <strong>
              Face #{idx + 1}: {face.identity}{" "}
              {face.confidence && `(${face.confidence.toFixed(1)})`}
            </strong>
            {face.alternatives && face.alternatives.length > 0 && (
              <ul style={{ marginTop: "5px", listStyle: "none", padding: 0 }}>
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
    </div>
  );
}
