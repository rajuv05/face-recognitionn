package com.example.attendancesystem.repository;

import com.example.attendancesystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<User> findByRollNo(String rollNo);
    Optional<User> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);
}
