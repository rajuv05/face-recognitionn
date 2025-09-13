import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import "./FaceSampleCollector.css";

export default function FaceSampleCollector() {
  const webcamRef = useRef(null);
  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [captured, setCaptured] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL); // for eyes/landmarks
    };
    loadModels();
  }, []);

  const captureImage = async () => {
    if (!webcamRef.current) return;
    const video = webcamRef.current.video;

    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true);

    if (detections.length === 0) return;

    const detection = detections[0];
    const { box } = detection.detection;
    const landmarks = detection.landmarks;

    // Expand bounding box
    let { x, y, width, height } = box;
    const expandFactor = 1.3;
    const cx = x + width / 2;
    const cy = y + height / 2;
    width *= expandFactor;
    height *= expandFactor;
    x = cx - width / 2;
    y = cy - height / 2;

    // Get eye positions
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const leftEyeCenter = {
      x: (leftEye[0].x + leftEye[3].x) / 2,
      y: (leftEye[1].y + leftEye[4].y) / 2,
    };
    const rightEyeCenter = {
      x: (rightEye[0].x + rightEye[3].x) / 2,
      y: (rightEye[1].y + rightEye[4].y) / 2,
    };

    // Compute angle between eyes
    const dx = rightEyeCenter.x - leftEyeCenter.x;
    const dy = rightEyeCenter.y - leftEyeCenter.y;
    const angle = Math.atan2(dy, dx);

    // Create a temp canvas for aligned face
    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;

    // Rotate entire frame around eyes center
    ctx.translate((leftEyeCenter.x + rightEyeCenter.x) / 2, (leftEyeCenter.y + rightEyeCenter.y) / 2);
    ctx.rotate(-angle);
    ctx.translate(-(leftEyeCenter.x + rightEyeCenter.x) / 2, -(leftEyeCenter.y + rightEyeCenter.y) / 2);
    ctx.drawImage(video, 0, 0);

    // Crop expanded & aligned face
    const faceCanvas = document.createElement("canvas");
    faceCanvas.width = 160; // standard size
    faceCanvas.height = 160;
    const faceCtx = faceCanvas.getContext("2d");
    faceCtx.drawImage(
      tempCanvas,
      x, y, width, height,
      0, 0, 160, 160
    );

    const croppedImage = faceCanvas.toDataURL("image/jpeg");
    const sampleCount = captured.length + 1;
    const filename = `${rollNo}_${name}_${String(sampleCount).padStart(2, "0")}.jpg`;

    setCaptured((prev) => [...prev, { image: croppedImage, filename }]);
  };

  const saveSamples = async () => {
    if (!rollNo || !name) {
      alert("Please enter Roll No and Name first!");
      return;
    }

    setSaving(true);
    try {
      for (const sample of captured) {
        const blob = await fetch(sample.image).then((res) => res.blob());
        const formData = new FormData();
        formData.append("file", blob, sample.filename);

        await fetch("http://localhost:8080/api/face/save-sample", {
          method: "POST",
          body: formData,
        });
      }

      const trainResponse = await fetch("http://localhost:8080/api/face/train", {
        method: "POST",
      });

      if (!trainResponse.ok) throw new Error("Training failed");

      alert("✅ Samples uploaded and training completed!");
      setCaptured([]);
    } catch (error) {
      console.error("Error while saving or training:", error);
      alert("❌ Failed to save samples or train model.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="collector-container">
      <div className="collector-card">
        <h2>🎓 Face Sample Collector</h2>
        <p className="subtitle">
          Capture and train student face data with enhanced cropping
        </p>

        <div className="input-row">
          <input
            type="text"
            placeholder="Roll No"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="webcam-wrapper">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={420}
            height={300}
          />
        </div>

        <div className="button-row">
          <button onClick={captureImage}>📸 Capture</button>
          <button onClick={saveSamples} disabled={captured.length === 0 || saving}>
            {saving ? "⏳ Saving..." : "💾 Save & Train"}
          </button>
        </div>

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
      </div>
    </div>
  );
}
