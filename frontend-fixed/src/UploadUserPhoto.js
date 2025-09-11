import React, { useState } from "react";
import axios from "axios";

const UploadUserPhoto = () => {
  const [userId, setUserId] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!userId || !file) {
      setMessage("Please provide User ID and select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:8080/api/user/uploadPhoto",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage(res.data);
      setFile(null);
      setUserId("");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed: " + (err.response?.data || err.message));
    }
  };

  return React.createElement(
    "div",
    { style: { maxWidth: 400, margin: "20px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 } },
    React.createElement("h2", null, "Upload User Photo"),
    React.createElement(
      "div",
      { style: { marginBottom: 10 } },
      React.createElement("label", null, "User ID:"),
      React.createElement("input", {
        type: "number",
        value: userId,
        onChange: e => setUserId(e.target.value),
        style: { width: "100%", padding: 5, marginTop: 5 }
      })
    ),
    React.createElement(
      "div",
      { style: { marginBottom: 10 } },
      React.createElement("label", null, "Photo:"),
      React.createElement("input", {
        type: "file",
        accept: "image/*",
        onChange: e => setFile(e.target.files[0]),
        style: { width: "100%", marginTop: 5 }
      })
    ),
    React.createElement(
      "button",
      { onClick: handleUpload, style: { padding: "8px 16px" } },
      "Upload"
    ),
    message && React.createElement("p", { style: { marginTop: 10 } }, message)
  );
};

export default UploadUserPhoto;
