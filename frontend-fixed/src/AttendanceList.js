import React, { useEffect, useState } from "react";
import axios from "axios";

const AttendanceList = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8080/api/attendance/list")
      .then(res => setRecords(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Attendance Records</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>User ID</th>
            <th>Username</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.userId}</td>
              <td>{r.username}</td>
              <td>{r.date}</td>
              <td>{r.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceList;
