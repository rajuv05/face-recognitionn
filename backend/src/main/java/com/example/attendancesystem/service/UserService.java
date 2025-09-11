package com.example.attendancesystem.service;

import com.example.attendancesystem.model.User;
import com.example.attendancesystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User loginUser(String usernameOrEmail, String password) {
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(usernameOrEmail, usernameOrEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // ✅ Only password check
            if (passwordEncoder.matches(password, user.getPassword())) {
                return user;
            }
        }

        return null; // invalid credentials
    }
}
