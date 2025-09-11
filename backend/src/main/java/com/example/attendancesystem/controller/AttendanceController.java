package com.example.attendancesystem.controller;

import com.example.attendancesystem.model.Attendance;
import com.example.attendancesystem.model.User;
import com.example.attendancesystem.repository.AttendanceRepository;
import com.example.attendancesystem.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    public AttendanceController(AttendanceRepository attendanceRepository, UserRepository userRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
    }

    // ✅ Mark attendance
    @PostMapping("/mark")
    public ResponseEntity<String> markAttendance(@RequestParam Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Optional: check if already marked today
        boolean alreadyMarked = attendanceRepository
                .findByUserIdAndDate(userId, LocalDate.now())
                .isPresent();
        if (alreadyMarked) {
            return ResponseEntity.badRequest().body("Attendance already marked for today");
        }

        Attendance a = new Attendance();
        a.setUser(user);  // ✅ Now we directly set the User object
        a.setDate(LocalDate.now());
        a.setTime(LocalTime.now());
        attendanceRepository.save(a);

        return ResponseEntity.ok("Attendance marked");
    }

    // ✅ List all attendances
    @GetMapping("/list")
    public List<AttendanceDTO> listAll() {
        return attendanceRepository.findAll().stream().map(att -> {
            User user = att.getUser();
            String username = (user != null) ? user.getUsername() : "Unknown";
            Long userId = (user != null) ? user.getId() : null;
            return new AttendanceDTO(att.getId(), userId, username, att.getDate(), att.getTime());
        }).collect(Collectors.toList());
    }

    // ✅ DTO
    public static class AttendanceDTO {
        private Long id;
        private Long userId;
        private String username;
        private LocalDate date;
        private LocalTime time;

        public AttendanceDTO(Long id, Long userId, String username, LocalDate date, LocalTime time) {
            this.id = id;
            this.userId = userId;
            this.username = username;
            this.date = date;
            this.time = time;
        }

        public Long getId() { return id; }
        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
        public LocalDate getDate() { return date; }
        public LocalTime getTime() { return time; }
    }
}
