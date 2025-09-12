import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AttendanceList.css";

const AttendanceList = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/attendance/list") // ✅ fixed endpoint
      .then((res) => setRecords(res.data))
      .catch((err) => console.error("❌ Error fetching attendance:", err));
  }, []);

  return (
    <div className="attendance-container">
      <h2 className="attendance-title gradient-text">📋 Attendance Records</h2>

      <table className="attendance-table">
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
            records.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.rollNo}</td>
                <td>{r.date}</td>
                <td>{r.time}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="no-records">
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
