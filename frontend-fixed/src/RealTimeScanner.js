import React, { useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";

export default function RealTimeScanner() {
  const webcamRef = useRef(null);

  // Convert Base64 → Blob
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
    if (!imageSrc) {
      console.error("Webcam did not capture image");
      return;
    }

    // Convert to Blob & send as FormData
    const blob = dataURLtoBlob(imageSrc);
    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    try {
      const res = await axios.post(
        "http://localhost:8080/api/face/recognize",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Recognition result:", res.data);
    } catch (err) {
      console.error("Error recognizing faces:", err);
    }
  };

  return (
    <div>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={640}
        height={480}
      />
      <button onClick={captureAndSend}>Scan Face</button>
    </div>
  );
}
