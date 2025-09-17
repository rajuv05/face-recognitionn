import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import AttendanceList from "./AttendanceList";
import RealTimeScanner from "./RealTimeScanner";
import AttendanceDashboard from "./AttendanceDashboard";
import FaceSampleCollector from "./FaceSampleCollector"; // ✅ Import new component

function App() {
  return (
    <Router>
      <div>
        <Routes>
          {/* 🔹 Auth routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 🔹 Dashboard + Features */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance-dashboard" element={<AttendanceDashboard />} />
          <Route path="/attendance-list" element={<AttendanceList />} />
          <Route path="/scanner" element={<RealTimeScanner />} />

          {/* 🔹 New: Face Sample Collector */}
          <Route path="/add-samples" element={<FaceSampleCollector />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
