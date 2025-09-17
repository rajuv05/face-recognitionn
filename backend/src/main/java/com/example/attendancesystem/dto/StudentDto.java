package com.example.attendancesystem.dto;

public class StudentDto {
    private String rollNo;
    private String name;

    public StudentDto(String rollNo, String name) {
        this.rollNo = rollNo;
        this.name = name;
    }

    public String getRollNo() {
        return rollNo;
    }

    public String getName() {
        return name;
    }
}
