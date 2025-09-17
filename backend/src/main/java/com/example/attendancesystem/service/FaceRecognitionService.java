package com.example.attendancesystem.service;

import ai.onnxruntime.*;
import com.example.attendancesystem.dto.FaceResult;
import org.bytedeco.javacpp.FloatPointer;
import org.bytedeco.javacpp.indexer.UByteIndexer;
import org.bytedeco.opencv.global.opencv_core;
import org.bytedeco.opencv.global.opencv_dnn;
import org.bytedeco.opencv.global.opencv_imgcodecs;
import org.bytedeco.opencv.global.opencv_imgproc;
import org.bytedeco.opencv.opencv_core.*;
import org.bytedeco.opencv.opencv_dnn.Net;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.*;
import java.nio.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FaceRecognitionService {

    private OrtEnvironment env;
    private OrtSession arcfaceSession;
    private String arcfaceInputName = null;
    private Net retinaNet;

    private final Map<String, float[]> registeredEmbeddings = new ConcurrentHashMap<>();
    private final Map<String, String> studentNames = new ConcurrentHashMap<>();
    private final List<Map<String, Object>> recognitionLogs = Collections.synchronizedList(new ArrayList<>());

    // ✅ RetinaFace MobileNet-320 input size
    private static final int RETINA_INPUT_SIZE = 320;

    // ✅ ArcFace similarity threshold
    private static final double MATCH_THRESHOLD = 0.60;

    @PostConstruct
    public void loadModels() throws Exception {
        env = OrtEnvironment.getEnvironment();

        // ✅ ArcFace w600k_r50 (~90 MB, FP32)
        Resource arcfaceResource = new ClassPathResource("models/w600k_r50.onnx");
        File arcfaceFile = copyToTempFile(arcfaceResource, "arcface-r50-");
        arcfaceSession = env.createSession(arcfaceFile.getAbsolutePath(), new OrtSession.SessionOptions());
        arcfaceInputName = arcfaceSession.getInputNames().iterator().next();

        // ✅ RetinaFace MobileNet-320 (~2 MB, FP32)
        Resource retinaResource = new ClassPathResource("models/retinaface-resnet50.onnx");
        File retinaFile = copyToTempFile(retinaResource, "retinaface-mb-");
        retinaNet = opencv_dnn.readNetFromONNX(retinaFile.getAbsolutePath());

        System.out.println("✅ Models loaded: RetinaFace MobileNet-320 + ArcFace w600k_r50");
    }

    private File copyToTempFile(Resource resource, String prefix) throws IOException {
        File tempFile = File.createTempFile(prefix, ".onnx");
        try (InputStream in = resource.getInputStream(); OutputStream out = new FileOutputStream(tempFile)) {
            in.transferTo(out);
        }
        tempFile.deleteOnExit();
        return tempFile;
    }

    /* ---------------- REGISTER ---------------- */
    public ResponseEntity<String> registerStudent(String rollNo, String name, List<MultipartFile> files) {
        try {
            if (files == null || files.isEmpty())
                return ResponseEntity.badRequest().body("No image files provided");

            List<float[]> embeddings = new ArrayList<>();
            for (MultipartFile file : files) {
                Mat face = detectSingleFace(file);
                if (face == null)
                    return ResponseEntity.badRequest().body("❌ No face in " + file.getOriginalFilename());
                embeddings.add(getFaceEmbedding(face));
            }

            float[] avg = averageEmbeddings(embeddings);
            registeredEmbeddings.put(rollNo, avg);
            studentNames.put(rollNo, name);

            return ResponseEntity.ok("✅ Registered " + name + " (" + rollNo + ")");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("❌ Registration failed: " + e.getMessage());
        }
    }

    private float[] averageEmbeddings(List<float[]> list) {
        int len = list.get(0).length;
        float[] avg = new float[len];
        for (float[] v : list) for (int i = 0; i < len; i++) avg[i] += v[i];
        for (int i = 0; i < len; i++) avg[i] /= list.size();
        return normalize(avg);
    }

    /* ---------------- RECOGNIZE SINGLE ---------------- */
    public FaceResult recognizeStudentFace(MultipartFile file, String lecture) {
        try {
            Mat face = detectSingleFace(file);
            if (face == null) {
                return new FaceResult(null, "No face detected", 0.0, "fail");
            }

            float[] emb = getFaceEmbedding(face);
            MatchResult match = findBestMatchWithScore(emb);

            if (match != null && match.similarity > MATCH_THRESHOLD) {
                String name = studentNames.get(match.rollNo);

                if (name == null) {
                    return new FaceResult(match.rollNo, "Unregistered name", match.similarity, "warning");
                }

                Map<String, Object> log = new HashMap<>();
                log.put("rollNo", match.rollNo);
                log.put("name", name);
                log.put("lecture", lecture);
                log.put("time", new Date().toString());
                log.put("accuracy", match.similarity);
                recognitionLogs.add(log);

                return new FaceResult(match.rollNo, name, match.similarity, "success");
            }

            return new FaceResult(null, "Unknown", 0.0, "unknown");

        } catch (Exception e) {
            e.printStackTrace();
            return new FaceResult(null, "Error: " + e.getMessage(), 0.0, "error");
        }
    }

    /* ---------------- FACE DETECTION ---------------- */
    private Mat detectSingleFace(MultipartFile file) throws IOException {
        File conv = convert(file);
        Mat img = opencv_imgcodecs.imread(conv.getAbsolutePath());
        if (img == null || img.empty()) return null;

        Mat resized = new Mat();
        opencv_imgproc.resize(img, resized, new Size(RETINA_INPUT_SIZE, RETINA_INPUT_SIZE));
        Mat blob = opencv_dnn.blobFromImage(resized, 1.0, new Size(RETINA_INPUT_SIZE, RETINA_INPUT_SIZE),
                new Scalar(104, 117, 123, 0), false, false, opencv_core.CV_32F);

        retinaNet.setInput(blob);
        MatVector outs = new MatVector();
        retinaNet.forward(outs, retinaNet.getUnconnectedOutLayersNames());

        if (outs.size() < 2) return null;

        FloatPointer conf = new FloatPointer(outs.get(1).data());
        FloatPointer loc = new FloatPointer(outs.get(0).data());
        List<float[]> anchors = generateAnchors(RETINA_INPUT_SIZE, RETINA_INPUT_SIZE);

        float maxScore = 0;
        Rect bestRect = null;
        int N = Math.min(anchors.size(), (int) outs.get(0).size(1));

        for (int i = 0; i < N; i++) {
            float score = conf.get(i * 2 + 1);
            if (score < 0.6f) continue;

            if (score > maxScore) {
                maxScore = score;

                float dx = loc.get(i * 4);
                float dy = loc.get(i * 4 + 1);
                float dw = loc.get(i * 4 + 2);
                float dh = loc.get(i * 4 + 3);

                float[] a = anchors.get(i);
                float cx = a[0] + dx * 0.1f * a[2];
                float cy = a[1] + dy * 0.1f * a[3];
                float w = (float) (Math.exp(dw * 0.2) * a[2]);
                float h = (float) (Math.exp(dh * 0.2) * a[3]);

                int x1 = Math.max(0, Math.round((cx - w / 2f) * img.cols()));
                int y1 = Math.max(0, Math.round((cy - h / 2f) * img.rows()));
                int bw = Math.min(img.cols() - x1, Math.round(w * img.cols()));
                int bh = Math.min(img.rows() - y1, Math.round(h * img.rows()));

                bestRect = new Rect(x1, y1, bw, bh);
            }
        }

        return bestRect == null ? null : new Mat(img, bestRect).clone();
    }

    /* ---------------- EMBEDDING ---------------- */
    private float[] getFaceEmbedding(Mat face) throws OrtException {
        Mat resized = new Mat();
        opencv_imgproc.resize(face, resized, new Size(112, 112));
        Mat rgb = new Mat();
        opencv_imgproc.cvtColor(resized, rgb, opencv_imgproc.COLOR_BGR2RGB);

        UByteIndexer idx = rgb.createIndexer();
        float[] chw = new float[3 * 112 * 112];
        int p = 0;
        for (int c = 0; c < 3; c++)
            for (int y = 0; y < 112; y++)
                for (int x = 0; x < 112; x++)
                    chw[p++] = (idx.get(y, x, c) - 127.5f) / 127.5f;
        idx.release();

        FloatBuffer fb = ByteBuffer.allocateDirect(chw.length * 4)
                .order(ByteOrder.nativeOrder()).asFloatBuffer();
        fb.put(chw).rewind();

        try (OnnxTensor tensor = OnnxTensor.createTensor(env, fb, new long[]{1, 3, 112, 112});
             OrtSession.Result res = arcfaceSession.run(Collections.singletonMap(arcfaceInputName, tensor))) {
            float[] emb = ((float[][]) res.get(0).getValue())[0];
            return normalize(emb);
        }
    }

    /* ---------------- MATCHING ---------------- */
    private MatchResult findBestMatchWithScore(float[] emb) {
        String best = null;
        double bestSim = -1;
        for (var e : registeredEmbeddings.entrySet()) {
            double sim = cosine(emb, e.getValue());
            if (sim > bestSim) { bestSim = sim; best = e.getKey(); }
        }
        return best != null ? new MatchResult(best, bestSim) : null;
    }

    private double cosine(float[] a, float[] b) {
        double dot=0, na=0, nb=0;
        for (int i=0;i<a.length;i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
        return dot / (Math.sqrt(na)*Math.sqrt(nb)+1e-6);
    }

    private float[] normalize(float[] v) {
        double norm=0; for(float x:v) norm+=x*x;
        norm=Math.sqrt(norm);
        for(int i=0;i<v.length;i++) v[i]/=(float)(norm+1e-6);
        return v;
    }

    /* ---------------- UTILS ---------------- */
    public File convert(MultipartFile file) throws IOException {
        File f = File.createTempFile("upload-", ".jpg");
        file.transferTo(f);
        return f;
    }

    private List<float[]> generateAnchors(int w, int h) {
        int[] steps = {8,16,32};
        float[][] minSizes = {{16,32},{64,128},{256,512}};
        List<float[]> anchors = new ArrayList<>();
        for (int i=0;i<steps.length;i++){
            int fmW=(int)Math.ceil((float)w/steps[i]);
            int fmH=(int)Math.ceil((float)h/steps[i]);
            for(int y=0;y<fmH;y++) for(int x=0;x<fmW;x++)
                for(float s:minSizes[i])
                    anchors.add(new float[]{
                            (x+0.5f)*steps[i]/(float)w,
                            (y+0.5f)*steps[i]/(float)h,
                            s/(float)w,
                            s/(float)h
                    });
        }
        return anchors;
    }

    /* ---------------- LOGS ---------------- */
    public List<Map<String,Object>> getRecognitionLogs() {
        return recognitionLogs;
    }

    /* ---------------- DEBUG ---------------- */
    public String testDetectOnly(MultipartFile file) throws IOException {
        File conv = convert(file);
        Mat face = detectSingleFace(file);
        if (face==null) return "❌ No face detected";
        String path = conv.getParent()+"/cropped.jpg";
        opencv_imgcodecs.imwrite(path, face);
        return "✅ Cropped face saved: "+path;
    }

    /* ---------------- Helper ---------------- */
    private static class MatchResult {
        String rollNo; double similarity;
        MatchResult(String r,double s){rollNo=r;similarity=s;}
    }
}
