package com.example.attendancesystem.repository;

import com.example.attendancesystem.model.Attendance;
import com.example.attendancesystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByUserAndDate(User user, LocalDate date);
}
