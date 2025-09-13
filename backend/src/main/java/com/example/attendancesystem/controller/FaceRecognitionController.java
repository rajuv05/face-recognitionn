package com.example.attendancesystem.controller;

import com.example.attendancesystem.model.Attendance;
import com.example.attendancesystem.repository.AttendanceRepository;
import com.example.attendancesystem.util.FaceTrainer;

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
import java.nio.file.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/face")
public class FaceRecognitionController {

    private LBPHFaceRecognizer recognizer;
    private final Map<Integer, StudentInfo> labelsMap = new HashMap<>();
    private final AttendanceRepository attendanceRepository;
    private CascadeClassifier faceDetector;

    private static final double CONFIDENCE_THRESHOLD = 50.0;

    private final String modelPath;
    private final String labelsPath;
    private final String trainingPath;
    private final String haarPath;
    private final String facesBasePath;

    public FaceRecognitionController(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;

        // ✅ Always resolve under backend/faces
        String basePath = System.getProperty("user.dir");
        this.facesBasePath = Paths.get(basePath, "faces").toString();

        this.trainingPath = Paths.get(facesBasePath, "training").toString();
        this.modelPath = Paths.get(facesBasePath, "trainer.yml").toString();
        this.labelsPath = Paths.get(facesBasePath, "labels.txt").toString();
        this.haarPath = Paths.get(facesBasePath, "haarcascade_frontalface_default.xml").toString();

        // ✅ Ensure directories exist
        new File(this.trainingPath).mkdirs();

        // ✅ Initialize recognizer
        recognizer = LBPHFaceRecognizer.create();
        if (new File(modelPath).exists()) {
            recognizer.read(modelPath);
            loadLabels(labelsPath);
        }

        // ✅ Load Haar Cascade
        faceDetector = new CascadeClassifier(haarPath);
        if (faceDetector.empty()) {
            System.err.println("❌ Haar Cascade not loaded at: " + haarPath);
        } else {
            System.out.println("✅ Haar Cascade loaded: " + haarPath);
        }
    }

    private void reloadModel() {
        try {
            recognizer = LBPHFaceRecognizer.create();
            recognizer.read(modelPath);
            labelsMap.clear();
            loadLabels(labelsPath);
            System.out.println("✅ Model reloaded successfully");
        } catch (Exception e) {
            System.err.println("⚠ Could not reload model: " + e.getMessage());
        }
    }

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

    // ✅ Save new face sample into faces/training and retrain
    @PostMapping("/save-sample")
    public ResponseEntity<String> saveSample(@RequestParam("file") MultipartFile file) {
        try {
            File dir = new File(trainingPath);
            if (!dir.exists()) dir.mkdirs();

            File dest = new File(dir, file.getOriginalFilename());
            file.transferTo(dest);

            // 🔹 Train directly using utility method
            FaceTrainer.train(facesBasePath);
            reloadModel();

            return ResponseEntity.ok("✅ Saved & Trained: " + file.getOriginalFilename());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("❌ Error: " + e.getMessage());
        }
    }

    // ✅ Train & reload (manual trigger)
    @PostMapping("/train")
    public ResponseEntity<String> trainModel() {
        try {
            FaceTrainer.train(facesBasePath);
            reloadModel();
            return ResponseEntity.ok("✅ Training completed and model reloaded");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("❌ Training failed: " + e.getMessage());
        }
    }

    // ✅ Recognize faces
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
                    if (distance <= CONFIDENCE_THRESHOLD) {
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

    private Mat getGrayImage(MultipartFile file) throws IOException {
        byte[] bytes = file.getBytes();
        Mat raw = new Mat(1, bytes.length, opencv_core.CV_8U, new BytePointer(bytes));
        return opencv_imgcodecs.imdecode(raw, opencv_imgcodecs.IMREAD_GRAYSCALE);
    }

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
