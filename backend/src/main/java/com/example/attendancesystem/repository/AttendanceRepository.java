package com.example.attendancesystem.repository;

import com.example.attendancesystem.dto.StudentProjection;
import com.example.attendancesystem.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    @Query("SELECT DISTINCT a.rollNo AS rollNo, a.name AS name FROM Attendance a")
    List<StudentProjection> findDistinctStudents();

    // Check duplicate attendance
    boolean existsByRollNoAndDateAndLectureAndSlot(
            String rollNo, LocalDate date, String lecture, Integer slot
    );

    // Fetch by rollNo + date range
    List<Attendance> findByRollNoAndDateBetween(
            String rollNo, LocalDate start, LocalDate end
    );

    // Delete student attendance
    void deleteByRollNo(String rollNo);

    // Delete all
    void deleteAll();
}
