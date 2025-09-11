import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import MarkAttendance from "./MarkAttendance";
import AttendanceList from "./AttendanceList";
import RealTimeScanner from "./RealTimeScanner";

function App() {
  return (
    <Router>
      <div>
        {/* Simple Navbar */}
        <nav style={{ padding: "10px", background: "#eee" }}>
          <Link to="/" style={{ margin: "10px" }}>Login</Link>
          <Link to="/signup" style={{ margin: "10px" }}>Signup</Link>
          <Link to="/dashboard" style={{ margin: "10px" }}>Dashboard</Link>
          <Link to="/mark-attendance" style={{ margin: "10px" }}>Mark Attendance</Link>
          <Link to="/attendance-list" style={{ margin: "10px" }}>Attendance List</Link>
          <Link to="/scanner" style={{ margin: "10px" }}>Scanner</Link>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mark-attendance" element={<MarkAttendance />} />
          <Route path="/attendance-list" element={<AttendanceList />} />
          <Route path="/scanner" element={<RealTimeScanner />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
