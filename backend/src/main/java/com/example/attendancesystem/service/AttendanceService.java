package com.example.attendancesystem.service;

import com.example.attendancesystem.dto.StudentProjection;
import com.example.attendancesystem.model.Attendance;
import com.example.attendancesystem.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;

    /** ✅ Mark attendance (prevents duplicates) */
    public String markAttendance(String name, String rollNo, String lecture, Integer slot) {
        LocalDate today = LocalDate.now();

        boolean exists = attendanceRepository.existsByRollNoAndDateAndLectureAndSlot(
                rollNo, today, lecture, slot
        );

        if (exists) {
            return "⚠️ Attendance already marked for " + rollNo + " (" + lecture + ")";
        }

        Attendance attendance = new Attendance();
        attendance.setName(name);
        attendance.setRollNo(rollNo);
        attendance.setLecture(lecture);
        attendance.setSlot(slot);
        attendance.setDate(today);

        attendance.setTime(LocalTime.now()); // ✅ fixes null-time issue
        attendanceRepository.save(attendance);

        return "✅ Attendance marked for " + name + " (" + rollNo + ")";
    }

    /** ✅ Fetch attendance by rollNo + month/year */
    public List<Attendance> getStudentAttendance(String rollNo, int year, int month) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return attendanceRepository.findByRollNoAndDateBetween(rollNo, start, end);
    }

    /** ✅ Clear attendance for single student */
    @Transactional
    public String clearStudentAttendance(String rollNo) {
        attendanceRepository.deleteByRollNo(rollNo);
        return "🗑️ Attendance cleared for rollNo " + rollNo;
    }

    /** ✅ Clear attendance for all students */
    @Transactional
    public String clearAllAttendance() {
        attendanceRepository.deleteAll();
        return "🗑️ Cleared attendance for all students";
    }

    /** ✅ Get distinct students (for sidebar list) */
    public List<StudentProjection> getAllStudents() {
        return attendanceRepository.findDistinctStudents();
    }
    /** ✅ Fetch all attendance */
    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

}
