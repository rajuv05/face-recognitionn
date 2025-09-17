import React, { useEffect, useState } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./AttendanceDashboard.css";

const AttendanceDashboard = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const subjects = ["MCE", "DSGT", "COA", "AOA", "OE", "ED", "ESE"];

  // 🔹 Fetch all students
  const fetchStudents = () => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/attendance/students`)
      .then((res) => {
        console.log("Fetched students:", res.data);
        setStudents(res.data || []); // ✅ backend returns array directly
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 🔹 Fetch attendance of selected student
  const fetchAttendance = () => {
    if (selectedStudent) {
      axios
        .get(
          `${process.env.REACT_APP_API_URL}/attendance/month/${selectedStudent.rollNo}/${month}/${year}`
        )
        .then((res) => {
          console.log("Fetched attendance:", res.data);
          setAttendance(res.data || []); // ✅ backend returns array directly
        })
        .catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedStudent, month, year]);

  // Clear attendance of single student
  const clearAttendance = async (rollNo) => {
    if (!window.confirm("Are you sure you want to clear this student's attendance?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/attendance/clear/${rollNo}`);
      alert("✅ Attendance cleared for student " + rollNo);
      if (selectedStudent?.rollNo === rollNo) setAttendance([]);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to clear attendance.");
    }
  };

  // Clear attendance for all students
  const clearAllAttendance = async () => {
    if (!window.confirm("⚠️ Are you sure you want to clear ALL students' attendance?")) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/attendance/clearAll`); // ✅ camelCase now
      alert("✅ Cleared attendance for all students");
      setAttendance([]);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to clear all attendance.");
    }
  };

  // ✅ Attendance calculations
  const today = new Date();
  const presentDays = new Set(attendance.map((a) => new Date(a.date).getDate())).size;

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
    totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(1) : 0;

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const isFuture = date > today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const present = attendance.some(
        (a) => new Date(a.date).toDateString() === date.toDateString()
      );

      if (isFuture) return "future";
      if (isWeekend) return "holiday";
      if (present) return "present";
      if (date.getMonth() + 1 === month && date.getFullYear() === year) return "absent";
    }
    return "";
  };

  // ✅ Count per subject
  const getSubjectCount = (subj) =>
    attendance.filter((a) => a.lecture === subj).length;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title gradient-text">📅 Attendance Dashboard</h2>

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
            {students.length === 0 ? (
              <li className="empty">⚠️ No students found</li>
            ) : (
              students
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
                ))
            )}
          </ul>

          <div className="sidebar-bottom">
            <button className="btn clear-all-btn" onClick={clearAllAttendance}>
              🗑️ Clear All Attendance
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {selectedStudent ? (
            <>
              <h3 className="student-heading gradient-text">
                {selectedStudent.name} – {month}/{year}
              </h3>

              <div className="main-flex">
                {/* Stats */}
                <div className="stats-cards">
                  <div className="stat-card present">
                    <h3>{presentDays}</h3>
                    <p>Present Days</p>
                  </div>
                  <div className="stat-card absent">
                    <h3>{absentDays}</h3>
                    <p>Absent Days</p>
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
                <div className="calendar-container">
                  <Calendar
                    value={new Date(year, month - 1)}
                    onActiveStartDateChange={({ activeStartDate }) => {
                      setMonth(activeStartDate.getMonth() + 1);
                      setYear(activeStartDate.getFullYear());
                    }}
                    tileClassName={tileClassName}
                    className="custom-calendar"
                  />

                  <button
                    className="btn clear-btn"
                    onClick={() => clearAttendance(selectedStudent.rollNo)}
                  >
                    🗑️ Clear {selectedStudent.name}'s Attendance
                  </button>
                </div>
              </div>

              {/* ✅ Lecture-wise Summary */}
              <div className="lecture-summary">
                <h3>📖 Lecture-wise Attendance</h3>
                {attendance.length === 0 ? (
                  <p className="empty">⚠️ No attendance records found</p>
                ) : (
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Presents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subj) => (
                        <tr key={subj}>
                          <td>{subj}</td>
                          <td>{getSubjectCount(subj)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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
