package com.example.attendancesystem.controller;

import com.example.attendancesystem.model.User;
import com.example.attendancesystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

@RestController
@RequestMapping("/api/user")
public class UserPhotoController {

    private static final String PHOTO_DIR = "user-photos/";

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/uploadPhoto")
    public ResponseEntity<String> uploadPhoto(@RequestParam Long userId,
                                              @RequestParam MultipartFile file) {
        try {
            // 1️⃣ Find user
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 2️⃣ Ensure folder exists
            File dir = new File(PHOTO_DIR);
            if (!dir.exists()) dir.mkdirs();

            // 3️⃣ Generate file name: userId + original extension
            String originalName = file.getOriginalFilename();
            String ext = originalName.substring(originalName.lastIndexOf("."));
            String fileName = userId + ext;
            String filePath = PHOTO_DIR + fileName;

            // 4️⃣ Save file
            file.transferTo(new File(filePath));

            // 5️⃣ Save path in database
            user.setPhotoPath(filePath);
            userRepository.save(user);

            return ResponseEntity.ok("Photo uploaded successfully: " + fileName);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Error uploading photo: " + e.getMessage());
        }
    }
}
