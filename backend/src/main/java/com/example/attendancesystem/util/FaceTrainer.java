package com.example.attendancesystem.util;

import org.bytedeco.opencv.global.opencv_core;
import org.bytedeco.opencv.global.opencv_imgcodecs;
import org.bytedeco.opencv.global.opencv_imgproc;
import org.bytedeco.opencv.opencv_core.Mat;
import org.bytedeco.opencv.opencv_core.MatVector;
import org.bytedeco.opencv.opencv_core.Size;
import org.bytedeco.opencv.opencv_face.LBPHFaceRecognizer;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.IntBuffer;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

public class FaceTrainer {

    public static void main(String[] args) throws IOException {
        String baseDir = System.getProperty("user.dir") + "/backend/faces";
        String facesDir = baseDir + "/training";
        String modelPath = baseDir + "/trainer.yml";
        String labelPath = baseDir + "/labels.txt";

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
        StringBuilder labelBuilder = new StringBuilder();

        // Map rollNo -> assigned label id
        Map<String, Integer> rollToLabel = new HashMap<>();
        // Keep rollNo -> name for label file output (only first name per roll)
        Map<String, String> rollToName = new HashMap<>();
        AtomicInteger nextLabelId = new AtomicInteger(0);

        for (File file : files) {
            Mat img = opencv_imgcodecs.imread(file.getAbsolutePath(), opencv_imgcodecs.IMREAD_GRAYSCALE);
            if (img == null || img.empty()) {
                System.out.println("⚠ Skipping invalid image: " + file.getName());
                continue;
            }

            // Resize to a consistent size (must match recognizer usage)
            opencv_imgproc.resize(img, img, new Size(200, 200));

            String filename = file.getName().split("\\.")[0]; // remove extension
            String[] parts = filename.split("_", 3); // rollNo_name_extra...

            if (parts.length < 2) {
                System.out.println("⚠ Skipping badly named file: " + file.getName() +
                        " — expected format rollNo_name[_extra].jpg");
                continue;
            }

            String rollNo = parts[0];
            String name = parts[1];

            // Assign same label ID for same rollNo (AtomicInteger used inside lambda)
            int assignedLabel = rollToLabel.computeIfAbsent(rollNo, k -> nextLabelId.getAndIncrement());

            images.add(img);
            labels.add(assignedLabel);

            // remember name for label file (only first occurrence)
            rollToName.putIfAbsent(rollNo, name);
        }

        if (images.isEmpty()) {
            System.out.println("❌ No valid images to train.");
            return;
        }

        // Convert List<Mat> → MatVector
        MatVector imagesVector = new MatVector(images.size());
        for (int i = 0; i < images.size(); i++) {
            imagesVector.put(i, images.get(i));
        }

        // Convert labels → Mat
        Mat labelsMat = new Mat(labels.size(), 1, opencv_core.CV_32SC1);
        IntBuffer labelsBuf = labelsMat.createBuffer();
        for (int l : labels) labelsBuf.put(l);

        // Train LBPH recognizer
        LBPHFaceRecognizer recognizer = LBPHFaceRecognizer.create();
        recognizer.train(imagesVector, labelsMat);

        // Save model
        recognizer.save(modelPath);

        // Build labels.txt from rollToLabel + rollToName maps
        // We'll write lines: <labelId>:<name>:<rollNo>
        // iterate entries in rollToLabel to ensure labelId matches written id
        List<Map.Entry<String,Integer>> entries = new ArrayList<>(rollToLabel.entrySet());
        // sort by assigned label id so file is deterministic (optional)
        entries.sort(Comparator.comparingInt(Map.Entry::getValue));

        try (FileWriter fw = new FileWriter(labelPath)) {
            for (Map.Entry<String,Integer> e : entries) {
                String rollNo = e.getKey();
                int labelId = e.getValue();
                String name = rollToName.getOrDefault(rollNo, "Unknown");
                fw.write(labelId + ":" + name + ":" + rollNo + "\n");
            }
        }

        System.out.println("✅ Training complete. Model saved at: " + modelPath);
        System.out.println("✅ Labels saved at: " + labelPath);
    }
}
