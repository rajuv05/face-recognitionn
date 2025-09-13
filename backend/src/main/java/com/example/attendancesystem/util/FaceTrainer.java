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

    // 🔹 Main is only for testing manually
    public static void main(String[] args) throws IOException {
        String baseDir = System.getProperty("user.dir") + "/faces"; // ✅ no backend/backend duplication
        train(baseDir);
    }

    // 🔹 Reusable method for controller
    public static void train(String baseDir) throws IOException {
        String facesDir = baseDir + "/training";
        String modelPath = baseDir + "/trainer.yml";
        String labelPath = baseDir + "/labels.txt";
        String haarPath = baseDir + "/haarcascade_frontalface_default.xml";

        CascadeClassifier faceDetector = new CascadeClassifier(haarPath);
        if (faceDetector.empty()) {
            throw new IOException("❌ Haar Cascade not found at: " + haarPath);
        }

        File dir = new File(facesDir);
        File[] files = dir.listFiles((d, name) ->
                name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".png")
        );
        if (files == null || files.length == 0) {
            throw new IOException("❌ No training images found in " + facesDir);
        }

        List<Mat> images = new ArrayList<>();
        List<Integer> labels = new ArrayList<>();
        Map<String, Integer> rollToLabel = new HashMap<>();
        Map<String, String> rollToName = new HashMap<>();
        AtomicInteger nextLabelId = new AtomicInteger(0);

        for (File file : files) {
            Mat imgColor = opencv_imgcodecs.imread(file.getAbsolutePath());
            if (imgColor == null || imgColor.empty()) {
                System.out.println("⚠ Skipping invalid: " + file.getName());
                continue;
            }

            Mat imgGray = new Mat();
            opencv_imgproc.cvtColor(imgColor, imgGray, opencv_imgproc.COLOR_BGR2GRAY);

            RectVector faces = new RectVector();
            faceDetector.detectMultiScale(imgGray, faces);

            if (faces.size() == 0) {
                System.out.println("⚠ No face found in: " + file.getName());
                continue;
            }

            Rect rect = faces.get(0);
            Mat faceROI = new Mat(imgGray, rect);
            opencv_imgproc.resize(faceROI, faceROI, new Size(200, 200));

            String filename = file.getName().split("\\.")[0];
            String[] parts = filename.split("_", 3);
            if (parts.length < 2) {
                System.out.println("⚠ Bad filename format: " + file.getName());
                continue;
            }

            String rollNo = parts[0];
            String name = parts[1];
            int assignedLabel = rollToLabel.computeIfAbsent(rollNo, k -> nextLabelId.getAndIncrement());

            images.add(faceROI);
            labels.add(assignedLabel);
            rollToName.putIfAbsent(rollNo, name);
        }

        if (images.isEmpty()) {
            throw new IOException("❌ No valid images to train.");
        }

        MatVector imagesVector = new MatVector(images.size());
        for (int i = 0; i < images.size(); i++) {
            imagesVector.put(i, images.get(i));
        }

        Mat labelsMat = new Mat(labels.size(), 1, opencv_core.CV_32SC1);
        IntBuffer buf = labelsMat.createBuffer();
        for (int l : labels) buf.put(l);

        LBPHFaceRecognizer recognizer = LBPHFaceRecognizer.create();
        recognizer.train(imagesVector, labelsMat);
        recognizer.save(modelPath);

        try (FileWriter fw = new FileWriter(labelPath)) {
            rollToLabel.forEach((roll, id) -> {
                try {
                    fw.write(id + ":" + rollToName.getOrDefault(roll, "Unknown") + ":" + roll + "\n");
                } catch (IOException e) {
                    e.printStackTrace();
                }
            });
        }

        System.out.println("✅ Training complete → Model: " + modelPath + ", Labels: " + labelPath);
    }
}
