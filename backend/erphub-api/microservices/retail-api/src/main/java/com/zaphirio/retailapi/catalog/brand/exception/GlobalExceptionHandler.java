package com.zaphirio.retailapi.catalog.brand.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleBadRequest(InvalidRequestException ex, HttpServletRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "Bad Request", ex, request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiError handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return build(HttpStatus.NOT_FOUND, "Not Found", ex, request);
    }

    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_CONTENT)
    public ApiError handleBusinessException(BusinessException ex, HttpServletRequest request) {
        log.warn("Business rule violation: {}", ex.getMessage());
        return build(HttpStatus.UNPROCESSABLE_CONTENT, "Business Rule Violation", ex, request);
    }

    @ExceptionHandler(InvalidImageResponseException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ApiError handleInvalidImageResponse(InvalidImageResponseException ex, HttpServletRequest request) {
        log.error("Image service error: {}", ex.getMessage());
        return build(HttpStatus.BAD_GATEWAY, "Upstream Service Error", ex, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream().map(err -> err.getField() + " " + err.getDefaultMessage()).findFirst().orElse("Validation failed");

        log.warn("Validation error: {}", message);

        return build(HttpStatus.BAD_REQUEST, "Validation Error", message, request);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiError handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", ex, request);
    }

    // ======================
    // Helper
    // ======================

    private ApiError build(HttpStatus status, String error, Exception ex, HttpServletRequest request) {
        return build(status, error, ex.getMessage(), request);
    }

    private ApiError build(HttpStatus status, String error, String message, HttpServletRequest request) {
        return new ApiError(Instant.now(), status.value(), error, message, request.getRequestURI());
    }
}