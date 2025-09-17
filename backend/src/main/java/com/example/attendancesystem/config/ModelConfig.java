package com.example.attendancesystem.config;

import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.nio.file.Path;

@Configuration
public class ModelConfig {

    private OrtEnvironment env = OrtEnvironment.getEnvironment();

    private Path copyResourceToTemp(String resourcePath) throws IOException {
        InputStream is = getClass().getClassLoader().getResourceAsStream(resourcePath);
        if (is == null) {
            throw new RuntimeException(resourcePath + " not found in resources/models/");
        }
        Path tempFile = Files.createTempFile("onnx_model_", ".onnx");
        Files.copy(is, tempFile, StandardCopyOption.REPLACE_EXISTING);
        return tempFile;
    }

    @Bean
    public OrtSession retinaFaceSession() throws Exception {
        Path modelPath = copyResourceToTemp("models/retinaface-resnet50.onnx");
        return env.createSession(modelPath.toString(), new OrtSession.SessionOptions());
    }

    @Bean
    public OrtSession arcFaceSession() throws Exception {
        Path modelPath = copyResourceToTemp("models/w600k_r50.onnx");
        return env.createSession(modelPath.toString(), new OrtSession.SessionOptions());
    }
}
