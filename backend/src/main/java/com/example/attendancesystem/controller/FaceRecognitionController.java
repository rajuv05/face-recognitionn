package com.example.attendancesystem.controller;

import com.example.attendancesystem.dto.FaceResult;
import com.example.attendancesystem.service.FaceRecognitionService;
import com.example.attendancesystem.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/face")
public class FaceRecognitionController {

    @Autowired
    private FaceRecognitionService faceService;

    @Autowired
    private AttendanceService attendanceService; // ✅ Fixed injection

    /** Register a student */
    @PostMapping("/register")
    public ResponseEntity<String> registerStudent(
            @RequestParam String rollNo,
            @RequestParam String name,
            @RequestParam("files") List<MultipartFile> files) {
        return faceService.registerStudent(rollNo, name, files);
    }

    /** Recognize single face + mark attendance */
    @PostMapping("/recognize")
    public ResponseEntity<?> recognizeStudent(
            @RequestParam("file") MultipartFile file,
            @RequestParam("lecture") String lecture,
            @RequestParam("slot") int slot) {

        FaceResult result = faceService.recognizeStudentFace(file, lecture);

        if ("success".equals(result.getStatus())) {
            // ✅ Now passing slot correctly
            String attendanceStatus = attendanceService.markAttendance(
                    result.getName(),
                    result.getRollNo(),
                    lecture,
                    slot
            );

            return ResponseEntity.ok(Map.of(
                    "rollNo", result.getRollNo(),
                    "name", result.getName(),
                    "accuracy", result.getAccuracy(),
                    "status", attendanceStatus
            ));
        } else {
            // recognition failed (unknown, no face, error, etc.)
            return ResponseEntity.ok(Map.of(
                    "rollNo", "N/A",
                    "name", "Unknown",
                    "accuracy", result.getAccuracy(),
                    "status", result.getStatus()
            ));
        }
    }

    /** Debug: Detect only */
    @PostMapping("/detect-only")
    public ResponseEntity<String> testDetectOnly(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(faceService.testDetectOnly(file));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("❌ Error: " + e.getMessage());
        }
    }

    /** Get recognition logs */
    @GetMapping("/logs")
    public List<Map<String, Object>> getRecognitionLogs() {
        return faceService.getRecognitionLogs();
    }
}
