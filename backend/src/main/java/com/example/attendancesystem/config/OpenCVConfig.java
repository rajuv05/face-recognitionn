package com.example.attendancesystem.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenCVConfig {

    @PostConstruct
    public void initOpenCV() {
        // ❌ Remove manual DLL loading
        // System.loadLibrary(Core.NATIVE_LIBRARY_NAME);

        // ✅ Bytedeco automatically loads OpenCV
        System.out.println("✅ OpenCV loaded via Bytedeco");
    }
}
