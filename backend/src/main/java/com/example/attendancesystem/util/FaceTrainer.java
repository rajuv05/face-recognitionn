package com.example.attendancesystem.util;

import org.bytedeco.opencv.global.opencv_core;
import org.bytedeco.opencv.global.opencv_imgcodecs;
import org.bytedeco.opencv.global.opencv_imgproc;
import org.bytedeco.opencv.opencv_core.*;
import org.bytedeco.opencv.opencv_face.LBPHFaceRecognizer;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.IntBuffer;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

public class FaceTrainer {

    public static void train(String baseDir) throws IOException {
        String facesDir = baseDir + "/training";
        String modelPath = baseDir + "/trainer.yml";
        String labelPath = baseDir + "/labels.txt";

        File dir = new File(facesDir);
        File[] files = dir.listFiles((d, name) ->
                name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".png")
        );

        if (files == null || files.length == 0) {
            System.out.println("⚠️ No training images found → skipping training");
            return; // instead of throwing, just skip
        }

        List<Mat> images = new ArrayList<>();
        List<Integer> labels = new ArrayList<>();
        Map<String, Integer> rollToLabel = new HashMap<>();
        Map<String, String> rollToName = new HashMap<>();
        AtomicInteger nextLabelId = new AtomicInteger(0);

        for (File file : files) {
            Mat imgGray = opencv_imgcodecs.imread(file.getAbsolutePath(), opencv_imgcodecs.IMREAD_GRAYSCALE);
            if (imgGray == null || imgGray.empty()) {
                System.out.println("⚠ Skipping invalid: " + file.getName());
                continue;
            }

            opencv_imgproc.equalizeHist(imgGray, imgGray);
            opencv_imgproc.resize(imgGray, imgGray, new Size(200, 200));

            String filename = file.getName().split("\\.")[0];
            String[] parts = filename.split("_", 3);
            if (parts.length < 2) {
                System.out.println("⚠ Bad filename format: " + file.getName());
                continue;
            }

            String rollNo = parts[0];
            String name = parts[1];
            int assignedLabel = rollToLabel.computeIfAbsent(rollNo, k -> nextLabelId.getAndIncrement());

            images.add(imgGray);
            labels.add(assignedLabel);
            rollToName.putIfAbsent(rollNo, name);
        }

        if (images.isEmpty()) {
            System.out.println("⚠️ No valid images to train.");
            return;
        }

        MatVector imagesVector = new MatVector(images.size());
        for (int i = 0; i < images.size(); i++) {
            imagesVector.put(i, images.get(i));
        }

        Mat labelsMat = new Mat(labels.size(), 1, opencv_core.CV_32SC1);
        IntBuffer buf = labelsMat.createBuffer();
        for (int l : labels) buf.put(l);

        LBPHFaceRecognizer recognizer = LBPHFaceRecognizer.create(2, 2, 8, 8, 100);
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
