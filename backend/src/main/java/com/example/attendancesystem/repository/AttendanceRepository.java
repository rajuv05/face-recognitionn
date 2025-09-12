package com.example.attendancesystem.repository;

import com.example.attendancesystem.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByRollNoAndDate(String rollNo, LocalDate date);

    // ✅ Custom query for month/year
    @Query("SELECT a FROM Attendance a WHERE a.rollNo = :rollNo " +
            "AND MONTH(a.date) = :month AND YEAR(a.date) = :year")
    List<Attendance> findByRollNoAndMonth(@Param("rollNo") String rollNo,
                                          @Param("month") int month,
                                          @Param("year") int year);
}
