package com.example.attendancesystem.repository;

import com.example.attendancesystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> { }
