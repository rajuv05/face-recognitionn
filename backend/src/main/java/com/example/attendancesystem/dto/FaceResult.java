package com.example.attendancesystem.dto;

public class FaceResult {
    private String rollNo;
    private String name;
    private double accuracy;
    private String status; // e.g., "success" or "unknown"

    public FaceResult() {}

    public FaceResult(String rollNo, String name, double accuracy, String status) {
        this.rollNo = rollNo;
        this.name = name;
        this.accuracy = accuracy;
        this.status = status;
    }

    public String getRollNo() {
        return rollNo;
    }

    public void setRollNo(String rollNo) {
        this.rollNo = rollNo;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
