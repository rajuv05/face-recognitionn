package com.example.attendancesystem.controller;

import com.example.attendancesystem.model.User;
import com.example.attendancesystem.payload.LoginRequest;
import com.example.attendancesystem.payload.MessageResponse;
import com.example.attendancesystem.payload.SignupRequest;
import com.example.attendancesystem.repository.UserRepository;
import com.example.attendancesystem.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        User user = userService.loginUser(loginRequest.getUsernameOrEmail(), loginRequest.getPassword());

        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid username/email or password"));
        }

        return ResponseEntity.ok(user);
    }

    // SIGNUP
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = new User();
        user.setUsername(signupRequest.getUsername());
        user.setEmail(signupRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        user.setEnabled(true); // directly enable user, no email verification

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
}
