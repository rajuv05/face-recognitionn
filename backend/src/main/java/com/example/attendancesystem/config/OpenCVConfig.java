package com.example.attendancesystem.config;

import jakarta.annotation.PostConstruct;
import org.opencv.core.Core;
import org.springframework.stereotype.Component;

@Component
public class OpenCVConfig {
    @PostConstruct
    public void initOpenCV() {
        System.loadLibrary(Core.NATIVE_LIBRARY_NAME);
        System.out.println("✅ OpenCV loaded successfully!");
    }
}
