package com.example.attendancesystem.controller;

import com.example.attendancesystem.model.Attendance;
import com.example.attendancesystem.repository.AttendanceRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;

    public AttendanceController(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    // ✅ Mark attendance manually (optional, mostly for testing)
    @PostMapping("/mark")
    public Attendance markAttendance(@RequestParam String name, @RequestParam String rollNo) {
        Attendance attendance = new Attendance(
                name,
                rollNo,
                LocalDate.now(),
                LocalTime.now()
        );
        return attendanceRepository.save(attendance);
    }

    // ✅ Get today’s attendance for a student
    @GetMapping("/today/{rollNo}")
    public List<Attendance> getTodayAttendance(@PathVariable String rollNo) {
        return attendanceRepository.findByRollNoAndDate(rollNo, LocalDate.now());
    }

    // ✅ Get ALL attendance records
    @GetMapping("/list")
    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    // ✅ Get unique students (name + rollNo)
    @GetMapping("/students")
    public List<Map<String, String>> getStudents() {
        return attendanceRepository.findAll()
                .stream()
                .map(a -> Map.of("name", a.getName(), "rollNo", a.getRollNo()))
                .distinct()
                .toList();
    }

    // ✅ Get attendance for a student in a specific month & year
    @GetMapping("/{rollNo}")
    public List<Attendance> getMonthlyAttendance(
            @PathVariable String rollNo,
            @RequestParam int month,
            @RequestParam int year) {
        return attendanceRepository.findByRollNoAndMonth(rollNo, month, year);
    }

    // ✅ Clear attendance for a specific student
    @DeleteMapping("/clear/{rollNo}")
    public String clearStudentAttendance(@PathVariable String rollNo) {
        attendanceRepository.deleteByRollNo(rollNo);
        return "✅ Attendance cleared for student with rollNo: " + rollNo;
    }

    // ✅ Clear ALL students' attendance
    @DeleteMapping("/clear-all")
    public String clearAllAttendance() {
        attendanceRepository.deleteAll();
        return "✅ All students' attendance cleared!";
    }
}
