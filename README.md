# Attendance Management System — Java Full Stack

A beginner-friendly mini project built with **Java 17, Spring Boot, Spring Data JPA, H2 Database, HTML, CSS, and JavaScript**.

## Features
- Add students with roll number, name, and course
- View and delete students
- Mark attendance as Present or Absent for a selected date
- View attendance records for a date
- Dashboard counts for students, present, and absent
- H2 database stores data locally while the application runs

## Requirements
- JDK 17 or newer
- Maven 3.6+ (or use Maven support in your IDE)
- VS Code with Extension Pack for Java, or IntelliJ IDEA

## Run the project
1. Install JDK 17 and Maven.
2. Extract this project ZIP.
3. Open the `attendance-management-java-fullstack` folder in VS Code.
4. Open a terminal in that folder.
5. Run:
   ```bash
   mvn spring-boot:run
   ```
6. Open **http://localhost:8080** in your browser.

If `mvn` is not recognized, install Maven and add its `bin` folder to your PATH, or run the project from IntelliJ IDEA using the Maven panel.

## Database console (optional)
- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/attendance_db`
- User Name: `sa`
- Password: leave blank

## API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/students` | List students |
| POST | `/api/students` | Add student |
| DELETE | `/api/students/{id}` | Delete student |
| GET | `/api/attendance?date=YYYY-MM-DD` | Get attendance for date |
| POST | `/api/attendance` | Create/update attendance |
| GET | `/api/attendance/summary?date=YYYY-MM-DD` | Dashboard counts |

## Push to GitHub
1. Create a new **empty** repository on GitHub named `attendance-management-java-fullstack`.
2. In the terminal, from the project folder run:
   ```bash
   git init
   git add .
   git commit -m "Initial attendance management system"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/attendance-management-java-fullstack.git
   git push -u origin main
   ```
3. Replace `YOUR-USERNAME` with your GitHub username.
4. Do not upload passwords, API keys, or private information. This project has no secrets configured.

## Notes
This is a learning/demo project. It does not include login, role permissions, or production-grade security.
