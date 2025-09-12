package com.example.attendancesystem.repository;

import com.example.attendancesystem.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByRollNoAndDate(String rollNo, LocalDate date);

    // ✅ Safer: use FUNCTION for month/year extraction
    @Query("SELECT a FROM Attendance a WHERE a.rollNo = :rollNo " +
            "AND FUNCTION('MONTH', a.date) = :month " +
            "AND FUNCTION('YEAR', a.date) = :year")
    List<Attendance> findByRollNoAndMonth(@Param("rollNo") String rollNo,
                                          @Param("month") int month,
                                          @Param("year") int year);

    // ✅ Clear attendance by roll number
    void deleteByRollNo(String rollNo);
}
