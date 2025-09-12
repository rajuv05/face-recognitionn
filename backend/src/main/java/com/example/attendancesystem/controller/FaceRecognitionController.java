package com.example.attendancesystem.controller;

import com.example.attendancesystem.model.Attendance;
import com.example.attendancesystem.repository.AttendanceRepository;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import org.bytedeco.javacpp.BytePointer;
import org.bytedeco.opencv.global.opencv_core;
import org.bytedeco.opencv.global.opencv_imgcodecs;
import org.bytedeco.opencv.global.opencv_imgproc;
import org.bytedeco.opencv.opencv_core.Mat;
import org.bytedeco.opencv.opencv_core.Rect;
import org.bytedeco.opencv.opencv_core.RectVector;
import org.bytedeco.opencv.opencv_face.LBPHFaceRecognizer;
import org.bytedeco.opencv.opencv_objdetect.CascadeClassifier;

import java.io.*;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/face")
public class FaceRecognitionController {

    private final LBPHFaceRecognizer recognizer;
    private final Map<Integer, StudentInfo> labelsMap = new HashMap<>();
    private final AttendanceRepository attendanceRepository;
    private final CascadeClassifier faceDetector;

    // ✅ Lower distance = better (LBPH returns distance, not probability)
    private static final double CONFIDENCE_THRESHOLD = 87.0;

    public FaceRecognitionController(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;

        String basePath = System.getProperty("user.dir");
        String modelPath = Paths.get(basePath, "faces", "trainer.yml").toString();
        String labelsPath = Paths.get(basePath, "faces", "labels.txt").toString();
        String haarPath = Paths.get(basePath, "faces", "haarcascade_frontalface_default.xml").toString();

        recognizer = LBPHFaceRecognizer.create();
        recognizer.read(modelPath);

        loadLabels(labelsPath);

        faceDetector = new CascadeClassifier(haarPath);
        if (faceDetector.empty()) {
            System.err.println("⚠ Failed to load Haar Cascade XML!");
        }
    }

    // ✅ Load labels (id:name:rollNo)
    private void loadLabels(String labelsPath) {
        try (BufferedReader br = new BufferedReader(new FileReader(labelsPath))) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.trim().split(":");
                if (parts.length == 3) {
                    int id = Integer.parseInt(parts[0].trim());
                    labelsMap.put(id, new StudentInfo(parts[1].trim(), parts[2].trim()));
                }
            }
            System.out.println("✅ Loaded labels: " + labelsMap);
        } catch (IOException e) {
            System.err.println("⚠ Could not load labels.txt: " + e.getMessage());
        }
    }

    @PostMapping("/save-sample")
    public ResponseEntity<String> saveSample(@RequestParam("file") MultipartFile file) {
        try {
            String basePath = System.getProperty("user.dir") + "/faces/training";
            File dir = new File(basePath);
            if (!dir.exists()) dir.mkdirs();

            File dest = new File(dir, file.getOriginalFilename());
            file.transferTo(dest);

            return ResponseEntity.ok("✅ Saved: " + file.getOriginalFilename());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("❌ Error: " + e.getMessage());
        }
    }

    @PostMapping("/recognize")
    public ResponseEntity<Map<String, Object>> recognizeFace(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> facesList = new ArrayList<>();
        StringBuilder msg = new StringBuilder();

        try {
            Mat imageGray = getGrayImage(file);
            if (imageGray.empty()) {
                response.put("message", "❌ Invalid image file");
                response.put("faces", facesList);
                return ResponseEntity.badRequest().body(response);
            }

            RectVector facesDetected = new RectVector();
            faceDetector.detectMultiScale(imageGray, facesDetected);

            if (facesDetected.empty()) {
                response.put("message", "❌ No face detected");
                response.put("faces", facesList);
                return ResponseEntity.ok(response);
            }

            for (int i = 0; i < facesDetected.size(); i++) {
                Rect rect = facesDetected.get(i);
                Mat faceROI = new Mat(imageGray, rect);

                // ✅ Resize to match training
                opencv_imgproc.resize(faceROI, faceROI, new org.bytedeco.opencv.opencv_core.Size(200, 200));

                int[] predictedLabel = new int[1];
                double[] predictedDistance = new double[1];
                recognizer.predict(faceROI, predictedLabel, predictedDistance);

                String identity = "Unknown";
                double distance = predictedDistance[0];
                StudentInfo matchedInfo = null;

                if (predictedLabel[0] != -1 && labelsMap.containsKey(predictedLabel[0])) {
                    matchedInfo = labelsMap.get(predictedLabel[0]);
                }

                if (matchedInfo != null) {
                    if (distance <= CONFIDENCE_THRESHOLD) {  // ✅ accept only if distance ≤ 85
                        markAttendance(matchedInfo, distance, msg);
                        identity = matchedInfo.getName();
                    } else {
                        msg.append("❌ Low confidence for face (Roll No: ")
                                .append(matchedInfo.getRollNo())
                                .append(", distance: ").append(distance).append(")\n");
                    }
                } else {
                    msg.append("❌ Face not recognized\n");
                }

                // Build face response
                Map<String, Object> faceData = new HashMap<>();
                faceData.put("x", rect.x());
                faceData.put("y", rect.y());
                faceData.put("width", rect.width());
                faceData.put("height", rect.height());
                faceData.put("identity", identity);
                faceData.put("distance", distance);

                facesList.add(faceData);
            }

            response.put("message", msg.toString().trim());
            response.put("faces", facesList);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("message", "⚠️ Error: " + e.getMessage());
            response.put("faces", facesList);
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Convert upload → grayscale Mat
    private Mat getGrayImage(MultipartFile file) throws IOException {
        byte[] bytes = file.getBytes();
        Mat raw = new Mat(1, bytes.length, opencv_core.CV_8U, new BytePointer(bytes));
        return opencv_imgcodecs.imdecode(raw, opencv_imgcodecs.IMREAD_GRAYSCALE);
    }

    // Mark attendance once per day
    private void markAttendance(StudentInfo info, double distance, StringBuilder msg) {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        boolean alreadyMarked = !attendanceRepository.findByRollNoAndDate(info.getRollNo(), today).isEmpty();

        if (!alreadyMarked) {
            Attendance attendance = new Attendance(info.getName(), info.getRollNo(), today, now.toLocalTime());
            attendanceRepository.save(attendance);

            msg.append("✅ Attendance marked for: ")
                    .append(info.getName())
                    .append(" (Roll No: ").append(info.getRollNo())
                    .append(", distance: ").append(distance).append(")\n");
        } else {
            msg.append("ℹ️ Already marked today for: ")
                    .append(info.getName())
                    .append(" (Roll No: ").append(info.getRollNo()).append(")\n");
        }
    }

    // Simple holder
    static class StudentInfo {
        private final String name;
        private final String rollNo;

        public StudentInfo(String name, String rollNo) {
            this.name = name;
            this.rollNo = rollNo;
        }

        public String getName() { return name; }
        public String getRollNo() { return rollNo; }

        @Override
        public String toString() {
            return name + " (Roll: " + rollNo + ")";
        }
    }
}
