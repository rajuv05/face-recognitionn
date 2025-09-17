import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function RealTimeScanner() {
  const webcamRef = useRef(null);
  const runningRef = useRef(false);

  const [message, setMessage] = useState("Waiting for scan...");
  const [status, setStatus] = useState("idle");
  const [isScanning, setIsScanning] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState("None");
  const [facingMode, setFacingMode] = useState("user");
  const [scannedFaces, setScannedFaces] = useState([]);
  const [toasts, setToasts] = useState([]);

  // dropdowns
  const [lectureOpen, setLectureOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const lectures = ["MCE", "DSGT", "COA", "AOA", "OE", "ED", "ESE"];
  const cameras = [
    { label: "Front Camera", value: "user" },
    { label: "Rear Camera", value: "environment" },
  ];

  /** Convert screenshot → Blob */
  const dataURLtoBlob = (dataURL) => {
    const [meta, base64] = dataURL.split(",");
    const mime = meta.match(/:(.*?);/)[1];
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  /** Show toast */
  const showToast = (text, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  /** Capture + Send */
  const captureAndSend = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      if (!webcamRef.current || selectedLecture === "None") {
        setMessage("⚠️ Select a lecture to start scanning");
        setStatus("warning");
        runningRef.current = false;
        return;
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        runningRef.current = false;
        return;
      }

      const blob = dataURLtoBlob(imageSrc);
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");
      formData.append("lecture", selectedLecture);
      formData.append("slot", 1);

      const { data: face } = await axios.post(
        `${process.env.REACT_APP_API_URL}/face/recognize`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (face && face.name && face.name !== "Unknown") {
        const { name, rollNo, accuracy } = face;

        const { data: attendanceResp } = await axios.post(
          `${process.env.REACT_APP_API_URL}/attendance/mark`,
          null,
          { params: { name, rollNo, lecture: selectedLecture, slot: 1 } }
        );

        const attMsg =
          typeof attendanceResp === "string"
            ? attendanceResp
            : attendanceResp.message || "No response";

        setMessage(
          `✅ ${name} (${rollNo}) | ${(accuracy * 100).toFixed(1)}% | ${attMsg}`
        );

        setScannedFaces((prev) => [
          ...prev,
          { name, rollNo, accuracy, lecture: selectedLecture, status: attMsg },
        ]);

        if (attMsg.toLowerCase().includes("already")) {
          setStatus("warning");
          showToast("⚠️ Already marked", "warning");
        } else if (attMsg.toLowerCase().includes("success")) {
          setStatus("success");
          showToast("✅ Present", "success");
        } else {
          setStatus("fail");
          showToast("❌ Not recorded", "error");
        }
      } else {
        setMessage("❌ No face recognized");
        setStatus("fail");
        showToast("⚠️ Unknown face", "warning");
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Backend error");
      setStatus("fail");
      showToast("⚠️ Backend Error", "error");
    } finally {
      runningRef.current = false;
    }
  }, [selectedLecture]);

  /** Auto loop */
  useEffect(() => {
    let interval;
    if (isScanning && selectedLecture !== "None") {
      interval = setInterval(() => captureAndSend(), 2000);
    }
    return () => clearInterval(interval);
  }, [isScanning, captureAndSend, selectedLecture]);

  const bannerColors = {
    success: "bg-green-500/80 text-white shadow-green-500/40",
    fail: "bg-red-500/80 text-white shadow-red-500/40",
    warning: "bg-yellow-500/80 text-black shadow-yellow-400/50",
    idle: "bg-gray-400/70 text-black",
  };

  /** Reusable dropdown component */
  const Dropdown = ({ label, value, options, isOpen, setIsOpen, onSelect }) => (
    <div className="relative w-60">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full px-4 py-2 rounded-xl bg-white/10 backdrop-blur-lg border border-white/30 text-white flex justify-between items-center"
      >
        {value}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="absolute mt-2 w-full rounded-xl bg-[#0B1220]/95 border border-white/20 shadow-xl z-50 backdrop-blur-xl overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt.value || opt}
                className="w-full text-left px-4 py-2 text-white hover:bg-cyan-600/40 transition"
                onClick={() => {
                  onSelect(opt.value || opt);
                  setIsOpen(false);
                }}
              >
                {opt.label || opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center
      bg-gradient-to-br from-[#041E29] via-[#122B44] to-[#1A103D]
      text-white p-4"
    >
      <motion.div
        className="relative w-full max-w-6xl rounded-3xl
        bg-white/10 backdrop-blur-2xl border border-white/20
        shadow-[0_0_25px_rgba(0,200,255,0.3)] p-6 md:p-10
        flex flex-col md:flex-row gap-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Left: Webcam */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold">👁️ Real-Time Scanner</h2>

          <motion.div
            className={`w-full py-2 px-4 rounded-full text-center text-sm font-medium shadow-md ${bannerColors[status]}`}
            key={message}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {message}
          </motion.div>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-white/20 w-full max-w-md">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full aspect-video object-cover"
              videoConstraints={{ facingMode }}
            />
          </div>

          <div className="flex gap-3 mt-3">
            <button
              className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg active:scale-95 transition"
              onClick={() => setIsScanning((s) => !s)}
            >
              {isScanning ? "⏸ Pause" : "▶️ Start"}
            </button>
          </div>

          {/* ✅ Camera Dropdown */}
          <Dropdown
            label="Camera"
            value={
              cameras.find((c) => c.value === facingMode)?.label ||
              "Select Camera"
            }
            options={cameras}
            isOpen={cameraOpen}
            setIsOpen={setCameraOpen}
            onSelect={(val) => setFacingMode(val)}
          />

          {/* ✅ Lecture Dropdown */}
          <Dropdown
            label="Lecture"
            value={
              selectedLecture === "None" ? "-- Select Lecture --" : selectedLecture
            }
            options={lectures}
            isOpen={lectureOpen}
            setIsOpen={setLectureOpen}
            onSelect={(val) => setSelectedLecture(val)}
          />
        </div>

        {/* Right: Scanned Faces */}
        <div className="flex-1 flex flex-col gap-4">
          <h3 className="text-xl font-semibold">📋 History</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[60vh]">
            <AnimatePresence>
              {scannedFaces.map((f, idx) => (
                <motion.div
                  key={idx}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow flex justify-between items-center"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                >
                  <div>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-sm text-gray-300">
                      {f.rollNo} | {f.lecture}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
                      f.status.toLowerCase().includes("success")
                        ? "bg-green-500/80 text-white"
                        : "bg-red-500/80 text-white"
                    }`}
                  >
                    {f.status}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Toasts */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 space-y-2 z-50">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`px-4 py-2 rounded-full shadow-lg ${
                  t.type === "success"
                    ? "bg-green-500 text-white"
                    : t.type === "error"
                    ? "bg-red-500 text-white"
                    : "bg-yellow-400 text-black"
                }`}
              >
                {t.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
