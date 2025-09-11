import React, { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const RealTimeScanner = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [lastMarkedUser, setLastMarkedUser] = useState(null);
  const [toast, setToast] = useState(null); // New: for showing notifications

  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: "image/jpeg" });
  };

  const drawFaces = (faces) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "lime";
    ctx.font = "18px Arial";
    ctx.fillStyle = "lime";

    faces.forEach(({ x, y, width, height, recognizedUser }, i) => {
      ctx.strokeRect(x, y, width, height);
      ctx.fillText(recognizedUser || `Face ${i + 1}`, x, y - 5);
    });
  };

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const formData = new FormData();
    formData.append("file", dataURLtoBlob(imageSrc), "frame.jpg");

    try {
      const res = await axios.post(
        "http://localhost:8080/api/face/recognize",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const { userId, username, faceBox } = res.data;

      // Mark attendance if recognized and not recently marked
      if (userId && username !== "Unknown" && userId !== lastMarkedUser) {
        await axios.post(`http://localhost:8080/api/attendance/mark?userId=${userId}`);
        setLastMarkedUser(userId);
        setToast(`${username} attendance marked ✅`); // Show toast
        setTimeout(() => setLastMarkedUser(null), 10000);
        setTimeout(() => setToast(null), 3000); // Hide toast after 3s
      }

      if (faceBox) {
        drawFaces([{ ...faceBox, recognizedUser: username }]);
      }
    } catch (err) {
      console.error("Error recognizing faces:", err);
    }
  }, [lastMarkedUser]);

  useEffect(() => {
    const interval = setInterval(capture, 1500);
    return () => clearInterval(interval);
  }, [capture]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
      />

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0,128,0,0.8)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            zIndex: 3,
            fontWeight: "bold",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default RealTimeScanner;
