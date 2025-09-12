package com.example.attendancesystem.util;

import org.bytedeco.opencv.global.opencv_core;
import org.bytedeco.opencv.global.opencv_imgcodecs;
import org.bytedeco.opencv.global.opencv_imgproc;
import org.bytedeco.opencv.opencv_core.*;
import org.bytedeco.opencv.opencv_face.LBPHFaceRecognizer;
import org.bytedeco.opencv.opencv_objdetect.CascadeClassifier;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.IntBuffer;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

public class FaceTrainer {

    public static void main(String[] args) throws IOException {
        // ✅ Always inside backend/faces
        String baseDir = System.getProperty("user.dir") + "/backend/faces";
        String facesDir = baseDir + "/training";
        String modelPath = baseDir + "/trainer.yml";
        String labelPath = baseDir + "/labels.txt";

        // Load Haar Cascade for face detection
        String haarPath = baseDir + "/haarcascade_frontalface_default.xml";
        CascadeClassifier faceDetector = new CascadeClassifier(haarPath);
        if (faceDetector.empty()) {
            System.err.println("❌ Haar Cascade not found at: " + haarPath);
            return;
        }

        File dir = new File(facesDir);
        File[] files = dir.listFiles((d, name) ->
                name.toLowerCase().endsWith(".jpg") ||
                        name.toLowerCase().endsWith(".png")
        );

        if (files == null || files.length == 0) {
            System.out.println("❌ No training images found in " + facesDir);
            return;
        }

        List<Mat> images = new ArrayList<>();
        List<Integer> labels = new ArrayList<>();
        Map<String, Integer> rollToLabel = new HashMap<>();
        Map<String, String> rollToName = new HashMap<>();
        AtomicInteger nextLabelId = new AtomicInteger(0);

        for (File file : files) {
            Mat imgColor = opencv_imgcodecs.imread(file.getAbsolutePath());
            if (imgColor == null || imgColor.empty()) {
                System.out.println("⚠ Skipping invalid image: " + file.getName());
                continue;
            }

            // Convert to grayscale
            Mat imgGray = new Mat();
            opencv_imgproc.cvtColor(imgColor, imgGray, opencv_imgproc.COLOR_BGR2GRAY);

            // Detect faces
            RectVector faces = new RectVector();
            faceDetector.detectMultiScale(imgGray, faces);

            if (faces.size() == 0) {
                System.out.println("⚠ No face found in: " + file.getName());
                continue;
            }

            // Take first detected face
            Rect rect = faces.get(0);
            Mat faceROI = new Mat(imgGray, rect);

            // Align face (center-based, no eye detection)
            Point2f center = new Point2f(faceROI.cols() / 2.0f, faceROI.rows() / 2.0f);
            Mat rotMat = opencv_imgproc.getRotationMatrix2D(center, 0, 1.0); // angle=0 for now
            Mat alignedFace = new Mat();
            opencv_imgproc.warpAffine(faceROI, alignedFace, rotMat, faceROI.size());

            // Resize
            opencv_imgproc.resize(alignedFace, alignedFace, new Size(200, 200));

            // Parse filename: rollNo_name_xx.jpg
            String filename = file.getName().split("\\.")[0];
            String[] parts = filename.split("_", 3);

            if (parts.length < 2) {
                System.out.println("⚠ Bad filename format: " + file.getName());
                continue;
            }

            String rollNo = parts[0];
            String name = parts[1];

            int assignedLabel = rollToLabel.computeIfAbsent(rollNo, k -> nextLabelId.getAndIncrement());

            images.add(alignedFace);
            labels.add(assignedLabel);
            rollToName.putIfAbsent(rollNo, name);
        }

        if (images.isEmpty()) {
            System.out.println("❌ No valid images to train.");
            return;
        }

        // Convert list to MatVector
        MatVector imagesVector = new MatVector(images.size());
        for (int i = 0; i < images.size(); i++) {
            imagesVector.put(i, images.get(i));
        }

        // Labels
        Mat labelsMat = new Mat(labels.size(), 1, opencv_core.CV_32SC1);
        IntBuffer labelsBuf = labelsMat.createBuffer();
        for (int l : labels) labelsBuf.put(l);

        // Train recognizer
        LBPHFaceRecognizer recognizer = LBPHFaceRecognizer.create();
        recognizer.train(imagesVector, labelsMat);
        recognizer.save(modelPath);

        // Save labels.txt
        List<Map.Entry<String, Integer>> entries = new ArrayList<>(rollToLabel.entrySet());
        entries.sort(Comparator.comparingInt(Map.Entry::getValue));

        try (FileWriter fw = new FileWriter(labelPath)) {
            for (Map.Entry<String, Integer> e : entries) {
                String rollNo = e.getKey();
                int labelId = e.getValue();
                String name = rollToName.getOrDefault(rollNo, "Unknown");
                fw.write(labelId + ":" + name + ":" + rollNo + "\n");
            }
        }

        System.out.println("✅ Training complete.");
        System.out.println("📂 Model saved at: " + modelPath);
        System.out.println("📂 Labels saved at: " + labelPath);
    }
}
