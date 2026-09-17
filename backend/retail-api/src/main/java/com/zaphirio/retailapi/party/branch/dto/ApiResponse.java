package com.zaphirio.retailapi.party.branch.dto;

import lombok.Data;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

/**
 * A generic API response wrapper that encapsulates the response data,
 * error message, status, and timestamp.
 *
 * @param <T> the type of the response data
 */
@Data
public class ApiResponse<T> {
    private T data;
    private String error;
    private int status;
    private LocalDateTime timestamp;

    /**
     * Constructs a successful ApiResponse with the given data.
     *
     * @param data the response data
     */
    public ApiResponse(T data) {
        this.data = data;
        this.error = null;
        this.status = HttpStatus.OK.value(); // 200
        this.timestamp = LocalDateTime.now();
    }

    /**
     * Constructs a successful ApiResponse with the given data and status.
     *
     * @param data   the response data
     * @param status the HTTP status code
     */
    public ApiResponse(T data, int status) {
        this.data = data;
        this.error = null;
        this.status = status;
        this.timestamp = LocalDateTime.now();
    }

    /**
     * Constructs an error ApiResponse with the given error message and status.
     *
     * @param error  the error message
     * @param status the HTTP status code
     */
    public ApiResponse(String error, int status) {
        this.error = error;
        this.data = null;
        this.status = status;
        this.timestamp = LocalDateTime.now();
    }

    /**
     * Creates a successful ApiResponse with the given data.
     *
     * @param data the response data
     * @param <T>  the type of the response data
     * @return a successful ApiResponse
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data);
    }

    /**
     * Creates a successful ApiResponse with the given data and status.
     *
     * @param data   the response data
     * @param status the HTTP status code
     * @param <T>    the type of the response data
     * @return a successful ApiResponse
     */
    public static <T> ApiResponse<T> success(T data, int status) {
        return new ApiResponse<>(data, status);
    }

    /**
     * Creates an error ApiResponse with the given error message and status.
     *
     * @param error  the error message
     * @param status the HTTP status code
     * @return an error ApiResponse
     */
    public static <T> ApiResponse<T> error(String error, int status) {
        return new ApiResponse<>(error, status);
    }
}
