package com.example.attendance.controller;

import com.example.attendance.model.Attendance;
import com.example.attendance.model.Student;
import com.example.attendance.repository.AttendanceRepository;
import com.example.attendance.repository.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    private final AttendanceRepository attendance;
    private final StudentRepository students;

    public AttendanceController(AttendanceRepository attendance, StudentRepository students) {
        this.attendance = attendance;
        this.students = students;
    }

    @GetMapping
    public List<Map<String, Object>> getAttendance(
            @RequestParam(defaultValue = "") String date) {
        LocalDate selectedDate = parseDate(date);
        return attendance.findByDateOrderByStudentNameAsc(selectedDate).stream().map(a -> Map.<String, Object>of(
                "id", a.getId(),
                "studentId", a.getStudent().getId(),
                "rollNumber", a.getStudent().getRollNumber(),
                "name", a.getStudent().getName(),
                "course", a.getStudent().getCourse(),
                "date", a.getDate().toString(),
                "status", a.getStatus()
        )).toList();
    }

    @PostMapping
    public Attendance markAttendance(@RequestBody AttendanceRequest request) {
        if (request.studentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId is required");
        }
        if (!"Present".equalsIgnoreCase(request.status()) && !"Absent".equalsIgnoreCase(request.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be Present or Absent");
        }
        LocalDate date = parseDate(request.date());
        Student student = students.findById(request.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        Attendance record = attendance.findByStudentIdAndDate(student.getId(), date)
                .orElseGet(() -> new Attendance(student, date, request.status()));
        record.setStatus(request.status().substring(0, 1).toUpperCase() +
                request.status().substring(1).toLowerCase());
        record.setDate(date);
        record.setStudent(student);
        return attendance.save(record);
    }

    @GetMapping("/summary")
    public Map<String, Long> summary(@RequestParam(defaultValue = "") String date) {
        LocalDate selectedDate = parseDate(date);
        long total = students.count();
        long present = attendance.countByDateAndStatusIgnoreCase(selectedDate, "Present");
        long absent = attendance.countByDateAndStatusIgnoreCase(selectedDate, "Absent");
        return Map.of("students", total, "present", present, "absent", absent,
                "notMarked", Math.max(0, total - present - absent));
    }

    private LocalDate parseDate(String date) {
        try {
            return (date == null || date.isBlank()) ? LocalDate.now() : LocalDate.parse(date);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date must use YYYY-MM-DD");
        }
    }

    public record AttendanceRequest(Long studentId, String date, String status) {}
}
