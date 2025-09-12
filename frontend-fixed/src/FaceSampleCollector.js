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
    };
    loadModels();
  }, []);

  const captureImage = async () => {
    if (!webcamRef.current) return;
    const video = webcamRef.current.video;

    const detections = await faceapi.detectAllFaces(
      video,
      new faceapi.TinyFaceDetectorOptions()
    );

    if (detections.length === 0) {
      return;
    }

    const { x, y, width, height } = detections[0].box;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(video, x, y, width, height, 0, 0, width, height);

    const croppedImage = tempCanvas.toDataURL("image/jpeg");
    const sampleCount = captured.length + 1;
    const filename = `${rollNo}_${name}_${String(sampleCount).padStart(
      2,
      "0"
    )}.jpg`;

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
          Capture and train student face data with ease
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
