import React, { useEffect, useState } from "react";
import axios from "axios";

const AttendanceList = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/attendance/all") // ✅ Correct endpoint
      .then((res) => setRecords(res.data))
      .catch((err) => console.error("Error fetching attendance:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "white" }}>📋 Attendance Records</h2>
      <table border="1" cellPadding="10" style={{ color: "white", width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Roll No</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {records.length > 0 ? (
            records.map((rec) => (
              <tr key={rec.id}>
                <td>{rec.id}</td>
                <td>{rec.name}</td>
                <td>{rec.rollNo}</td>
                <td>{rec.date}</td>
                <td>{rec.time}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceList;
