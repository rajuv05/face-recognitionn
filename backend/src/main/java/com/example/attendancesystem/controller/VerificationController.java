package com.example.attendancesystem.controller;

import com.example.attendancesystem.model.User;
import com.example.attendancesystem.model.VerificationToken;
import com.example.attendancesystem.repository.UserRepository;
import com.example.attendancesystem.repository.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class VerificationController {

    @Autowired
    private VerificationTokenRepository tokenRepo;

    @Autowired
    private UserRepository userRepo;

    // Changed path to avoid conflict with AuthController
    @GetMapping("/verify-text")
    public String verifyAccountText(@RequestParam("token") String token) {
        VerificationToken verificationToken = tokenRepo.findByToken(token);

        if (verificationToken == null) {
            return "Invalid verification token!";
        }

        User user = verificationToken.getUser();
        if (user == null) {
            return "No user found for this token!";
        }

        user.setEnabled(true);
        userRepo.save(user);

        // Optionally delete the token after verification
        tokenRepo.delete(verificationToken);

        return "Account verified successfully! You can now log in.";
    }
}
