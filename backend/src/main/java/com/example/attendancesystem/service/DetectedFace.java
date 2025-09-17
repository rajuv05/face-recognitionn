package com.example.attendancesystem.service;

public class DetectedFace {
    private int x, y, width, height;
    private String name;
    private String rollNo;

    public DetectedFace(int x, int y, int width, int height, String name, String rollNo) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.name = name;
        this.rollNo = rollNo;
    }

    public int getX() { return x; }
    public int getY() { return y; }
    public int getWidth() { return width; }
    public int getHeight() { return height; }
    public String getName() { return name; }
    public String getRollNo() { return rollNo; }
}
