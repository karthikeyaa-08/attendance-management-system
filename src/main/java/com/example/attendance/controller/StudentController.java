package com.example.attendance.controller;

import com.example.attendance.model.Student;
import com.example.attendance.repository.StudentRepository;
import com.example.attendance.repository.AttendanceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    private final StudentRepository students;
    private final AttendanceRepository attendance;

    public StudentController(StudentRepository students, AttendanceRepository attendance) {
        this.students = students;
        this.attendance = attendance;
    }

    @GetMapping
    public List<Student> getStudents() {
        return students.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Student addStudent(@Valid @RequestBody Student student) {
        if (students.existsByRollNumberIgnoreCase(student.getRollNumber().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Roll number already exists");
        }
        student.setRollNumber(student.getRollNumber().trim());
        student.setName(student.getName().trim());
        student.setCourse(student.getCourse().trim());
        return students.save(student);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStudent(@PathVariable Long id) {
        Student student = students.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        attendance.findAll().stream()
                .filter(a -> a.getStudent().getId().equals(id))
                .toList()
                .forEach(attendance::delete);
        students.delete(student);
    }
}
