package com.example.attendance.repository;

import com.example.attendance.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {
    boolean existsByRollNumberIgnoreCase(String rollNumber);
}
