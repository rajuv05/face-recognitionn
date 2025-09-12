package com.example.attendancesystem.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
        name = "attendance",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"rollNo", "date"}) // ✅ Prevents duplicate attendance for same day
        }
)
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String rollNo;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime time;

    // ✅ Default constructor (required by JPA)
    public Attendance() {}

    // ✅ Convenience constructor
    public Attendance(String name, String rollNo, LocalDate date, LocalTime time) {
        this.name = name;
        this.rollNo = rollNo;
        this.date = date;
        this.time = time;
    }

    // ✅ Getters & Setters
    public Long getId() { return id; }

    public String getRollNo() { return rollNo; }
    public void setRollNo(String rollNo) { this.rollNo = rollNo; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getTime() { return time; }
    public void setTime(LocalTime time) { this.time = time; }

    // ✅ ToString
    @Override
    public String toString() {
        return "Attendance{" +
                "id=" + id +
                ", rollNo='" + rollNo + '\'' +
                ", name='" + name + '\'' +
                ", date=" + date +
                ", time=" + time +
                '}';
    }
}
