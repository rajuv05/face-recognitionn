package com.example.attendancesystem.repository;

import com.example.attendancesystem.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Student findByRollNo(String rollNo);
}
