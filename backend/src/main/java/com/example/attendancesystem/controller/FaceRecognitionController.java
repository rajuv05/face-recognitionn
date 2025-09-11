package com.example.attendancesystem.controller;

import com.example.attendancesystem.model.User;
import com.example.attendancesystem.repository.UserRepository;
import org.bytedeco.javacpp.FloatPointer;
import org.bytedeco.javacpp.IntPointer;
import org.bytedeco.opencv.global.opencv_core;
import org.bytedeco.opencv.global.opencv_imgcodecs;
import org.bytedeco.opencv.global.opencv_imgproc;
import org.bytedeco.opencv.opencv_core.Mat;
import org.bytedeco.opencv.opencv_core.MatVector;
import org.bytedeco.opencv.opencv_core.Rect;
import org.bytedeco.opencv.opencv_core.RectVector;
import org.bytedeco.opencv.opencv_core.Size;
import org.bytedeco.opencv.opencv_objdetect.CascadeClassifier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;

@RestController
@RequestMapping("/api/face")
public class FaceRecognitionController {

    private static final String UPLOAD_DIR = "uploads/";

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/recognize")
    public ResponseEntity<?> recognizeFace(@RequestParam("file") MultipartFile file) {
        try {
            // Ensure upload folder exists
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) uploadDir.mkdirs();

            // Save uploaded frame temporarily
            String filePath = UPLOAD_DIR + file.getOriginalFilename();
            file.transferTo(new File(filePath));

            // Load frame using JavaCPP OpenCV
            Mat image = opencv_imgcodecs.imread(filePath);
            if (image.empty()) {
                return ResponseEntity.badRequest().body("Invalid image file");
            }

            // ✅ Load Haar Cascade from resources safely
            ClassPathResource resource =
                    new ClassPathResource("haarcascades/haarcascade_frontalface_default.xml");

            File tempFile = File.createTempFile("cascade", ".xml");
            try (InputStream in = resource.getInputStream();
                 OutputStream out = new FileOutputStream(tempFile)) {
                in.transferTo(out);
            }

            CascadeClassifier faceDetector = new CascadeClassifier(tempFile.getAbsolutePath());
            if (faceDetector.empty()) {
                return ResponseEntity.status(500).body("Failed to load cascade classifier");
            }

            // Detect faces
            RectVector faces = new RectVector();
            faceDetector.detectMultiScale(image, faces);

            List<Map<String, Object>> results = new ArrayList<>();

            for (long i = 0; i < faces.size(); i++) {
                Rect rect = faces.get(i);

                // Crop face
                Mat detectedFace = new Mat(image, rect);

                // Convert to grayscale
                Mat grayDetected = new Mat();
                opencv_imgproc.cvtColor(detectedFace, grayDetected, opencv_imgproc.COLOR_BGR2GRAY);

                Long recognizedUserId = null;
                String recognizedUsername = "Unknown";

                // Compare with stored user photos
                List<User> users = userRepository.findAll();
                for (User user : users) {
                    if (user.getPhotoPath() == null) continue;

                    Mat knownImg = opencv_imgcodecs.imread(user.getPhotoPath(),
                            opencv_imgcodecs.IMREAD_GRAYSCALE);
                    if (knownImg.empty()) continue;

                    // Resize both images
                    Size size = new Size(200, 200);
                    opencv_imgproc.resize(grayDetected, grayDetected, size);
                    opencv_imgproc.resize(knownImg, knownImg, size);

                    // Histogram comparison
                    Mat hist1 = new Mat();
                    Mat hist2 = new Mat();
                    int[] channels = {0};
                    int[] histSize = {256};
                    float[] ranges = {0, 256};

                    IntPointer chPtr = new IntPointer(channels);
                    IntPointer histSizePtr = new IntPointer(histSize);
                    FloatPointer rangePtr = new FloatPointer(ranges);

                    opencv_imgproc.calcHist(new MatVector(grayDetected), chPtr,
                            new Mat(), hist1, histSizePtr, rangePtr, false);
                    opencv_imgproc.calcHist(new MatVector(knownImg), chPtr,
                            new Mat(), hist2, histSizePtr, rangePtr, false);

                    opencv_core.normalize(hist1, hist1, 0, 1,
                            opencv_core.NORM_MINMAX, -1, null);
                    opencv_core.normalize(hist2, hist2, 0, 1,
                            opencv_core.NORM_MINMAX, -1, null);

                    double similarity = opencv_imgproc.compareHist(hist1, hist2,
                            opencv_imgproc.CV_COMP_CORREL);

                    if (similarity > 0.7) { // match threshold
                        recognizedUserId = user.getId();
                        recognizedUsername = user.getUsername();
                        break;
                    }
                }

                // Add face result
                Map<String, Object> faceResult = new HashMap<>();
                faceResult.put("x", rect.x());
                faceResult.put("y", rect.y());
                faceResult.put("width", rect.width());
                faceResult.put("height", rect.height());
                faceResult.put("userId", recognizedUserId);
                faceResult.put("username", recognizedUsername);

                results.add(faceResult);
            }

            return ResponseEntity.ok(results);

        } catch (Exception e) {
            e.printStackTrace(); // ✅ log error to console
            return ResponseEntity.status(500).body("Error processing file: " + e.getMessage());
        }
    }
}
