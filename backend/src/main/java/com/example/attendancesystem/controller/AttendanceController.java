package com.example.attendancesystem.controller;

import com.example.attendancesystem.dto.StudentProjection;
import com.example.attendancesystem.model.Attendance;
import com.example.attendancesystem.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    /** ✅ Mark attendance */
    @PostMapping("/mark")
    public ResponseEntity<String> markAttendance(
            @RequestParam String name,
            @RequestParam String rollNo,
            @RequestParam String lecture,
            @RequestParam(required = false) Integer slot
    ) {
        return ResponseEntity.ok(attendanceService.markAttendance(name, rollNo, lecture, slot));
    }

    /** ✅ Fetch student attendance (query param version) */
    @GetMapping("/history/{rollNo}")
    public ResponseEntity<List<Attendance>> getStudentAttendance(
            @PathVariable String rollNo,
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ResponseEntity.ok(attendanceService.getStudentAttendance(rollNo, year, month));
    }

    /** ✅ Fetch student attendance (path variable version for React) */
    @GetMapping("/month/{rollNo}/{month}/{year}")
    public ResponseEntity<List<Attendance>> getStudentAttendanceByMonth(
            @PathVariable String rollNo,
            @PathVariable int month,
            @PathVariable int year
    ) {
        return ResponseEntity.ok(attendanceService.getStudentAttendance(rollNo, year, month));
    }

    /** ✅ Clear one student’s attendance */
    @DeleteMapping("/clear/{rollNo}")
    public ResponseEntity<String> clearStudentAttendance(@PathVariable String rollNo) {
        return ResponseEntity.ok(attendanceService.clearStudentAttendance(rollNo));
    }

    /** ✅ Clear all attendance (camelCase) */
    @DeleteMapping("/clearAll")
    public ResponseEntity<String> clearAllAttendance() {
        return ResponseEntity.ok(attendanceService.clearAllAttendance());
    }

    /** ✅ Fetch all distinct students */
    @GetMapping("/students")
    public ResponseEntity<List<StudentProjection>> getStudents() {
        return ResponseEntity.ok(attendanceService.getAllStudents());
    }

    /** ✅ Fetch all attendance records */
    @GetMapping("/list")
    public ResponseEntity<List<Attendance>> getAllAttendance() {
        return ResponseEntity.ok(attendanceService.getAllAttendance());
    }
}
