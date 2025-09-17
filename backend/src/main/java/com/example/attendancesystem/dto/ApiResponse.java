package com.example.attendancesystem.dto;

public class ApiResponse<T> {
    private String status;  // "success", "error", "warning"
    private String message;
    private T data;

    public ApiResponse(String status, String message, T data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>("success", message, data);
    }

    public static <T> ApiResponse<T> warning(String message, T data) {
        return new ApiResponse<>("warning", message, data);
    }

    public static <T> ApiResponse<T> error(String message, T data) {
        return new ApiResponse<>("error", message, data);
    }

    // Getters & Setters
    public String getStatus() { return status; }
    public String getMessage() { return message; }
    public T getData() { return data; }
}
