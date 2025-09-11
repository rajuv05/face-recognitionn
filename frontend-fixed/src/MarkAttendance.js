import React, { useState } from "react";
import axios from "axios";

function MarkAttendance() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [processedFile, setProcessedFile] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8080/api/face/detect", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(`✅ Faces detected: ${res.data.facesDetected}`);
      setProcessedFile(res.data.processedFile);
    } catch (err) {
      setMessage("❌ Upload Failed: " + err.message);
    }
  };

  return (
    <div>
      <h2>Mark Attendance</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload & Detect</button>
      <p>{message}</p>

      {processedFile && (
        <img
          src={`http://localhost:8080/${processedFile}`}
          alt="Detected Faces"
          width="400"
        />
      )}
    </div>
  );
}

export default MarkAttendance;
