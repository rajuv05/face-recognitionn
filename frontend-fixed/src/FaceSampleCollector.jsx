import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

export default function FaceSampleCollector() {
  const webcamRef = useRef(null);
  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [captured, setCaptured] = useState([]);

  const captureImage = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const sampleCount = captured.length + 1;
      const filename = `${rollNo}_${name}_${String(sampleCount).padStart(
        2,
        "0"
      )}.jpg`;

      setCaptured((prev) => [...prev, { image: imageSrc, filename }]);
    }
  };

  const saveSamples = async () => {
    if (!rollNo || !name) {
      alert("Please enter Roll No and Name first!");
      return;
    }

    for (const sample of captured) {
      const blob = await fetch(sample.image).then((res) => res.blob());
      const formData = new FormData();
      formData.append("file", blob, sample.filename);

      await fetch("http://localhost:8080/api/face/save-sample", {
        method: "POST",
        body: formData,
      });
    }

    alert("✅ All samples uploaded successfully!");
    setCaptured([]);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🎓 Face Sample Collector</h2>

      {/* Input fields */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Roll No"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Webcam */}
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={400}
        height={300}
        style={{ borderRadius: "8px", marginBottom: "10px" }}
      />

      <div>
        <button onClick={captureImage} style={{ marginRight: "10px" }}>
          📸 Capture Sample
        </button>
        <button onClick={saveSamples} disabled={captured.length === 0}>
          💾 Save Samples
        </button>
      </div>

      {/* Preview Captured Samples */}
      <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap" }}>
        {captured.map((sample, idx) => (
          <div key={idx} style={{ margin: "5px", textAlign: "center" }}>
            <img
              src={sample.image}
              alt={`sample-${idx}`}
              width={100}
              height={100}
              style={{ borderRadius: "6px", border: "1px solid #ccc" }}
            />
            <div style={{ fontSize: "12px" }}>{sample.filename}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
