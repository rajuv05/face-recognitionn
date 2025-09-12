import React, { useEffect, useState } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./AttendanceDashboard.css"; // ✅ styles

const AttendanceDashboard = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/attendance/students")
      .then((res) => setStudents(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      axios
        .get(
          `http://localhost:8080/api/attendance/${selectedStudent.rollNo}?month=${month}&year=${year}`
        )
        .then((res) => setAttendance(res.data))
        .catch((err) => console.error(err));
    }
  }, [selectedStudent, month, year]);

  const today = new Date();
  const presentDays = new Set(
    attendance.map((a) => new Date(a.date).getDate())
  ).size;

  const daysInMonth = new Date(year, month, 0).getDate();
  let totalWorkingDays = 0;
  let holidayCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (date <= today) {
      if (date.getDay() === 0 || date.getDay() === 6) {
        holidayCount++;
      } else {
        totalWorkingDays++;
      }
    }
  }

  const absentDays = totalWorkingDays - presentDays;
  const percentage =
    totalWorkingDays > 0
      ? ((presentDays / totalWorkingDays) * 100).toFixed(1)
      : 0;

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const day = date.getDate();
      const isFuture = date > today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const present = attendance.some(
        (a) => new Date(a.date).toDateString() === date.toDateString()
      );

      if (isFuture) return "future";
      if (isWeekend) return "holiday";
      if (present) return "present";
      if (date.getMonth() + 1 === month && date.getFullYear() === year)
        return "absent";
    }
    return "";
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">📅 Attendance Dashboard</h2>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <input
            type="text"
            placeholder="🔍 Search by name or roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <ul className="student-list">
            {students
              .filter(
                (s) =>
                  s.name.toLowerCase().includes(search.toLowerCase()) ||
                  s.rollNo.includes(search)
              )
              .map((s) => (
                <li
                  key={s.rollNo}
                  className={`student-item ${
                    selectedStudent?.rollNo === s.rollNo ? "active" : ""
                  }`}
                  onClick={() => setSelectedStudent(s)}
                >
                  <span className="student-name">{s.name}</span>
                  <span className="student-roll">({s.rollNo})</span>
                </li>
              ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {selectedStudent ? (
            <>
              <h3 className="student-heading">
                {selectedStudent.name} – {month}/{year}
              </h3>

              <div className="main-flex">
                {/* Stats */}
                <div className="stats-cards">
                  <div className="stat-card present">
                    <h3>{presentDays}</h3>
                    <p>Present</p>
                  </div>
                  <div className="stat-card absent">
                    <h3>{absentDays}</h3>
                    <p>Absent</p>
                  </div>
                  <div className="stat-card holiday">
                    <h3>{holidayCount}</h3>
                    <p>Holidays</p>
                  </div>
                  <div className="stat-card percentage">
                    <h3>{percentage}%</h3>
                    <p>Attendance</p>
                  </div>
                </div>

                {/* Calendar */}
                <Calendar
                  value={new Date(year, month - 1)}
                  onActiveStartDateChange={({ activeStartDate }) => {
                    setMonth(activeStartDate.getMonth() + 1);
                    setYear(activeStartDate.getFullYear());
                  }}
                  tileClassName={tileClassName}
                  className="custom-calendar"
                />
              </div>
            </>
          ) : (
            <div className="placeholder">👈 Select a student to view attendance</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
