package com.zaphirio.retailapi.shared.exception;

import com.zaphirio.retailapi.auth.exception.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.time.Instant;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiError handleBadRequest(InvalidRequestException ex, HttpServletRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, ERROR_BAD_REQUEST, ex, request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiError handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return build(HttpStatus.NOT_FOUND, ERROR_NOT_FOUND, ex, request);
    }


    @ExceptionHandler(InvalidImageResponseException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ApiError handleInvalidImageResponse(InvalidImageResponseException ex, HttpServletRequest request) {
        log.error("Image service error: {}", ex.getMessage());
        return build(HttpStatus.BAD_GATEWAY, "Upstream Service Error", ex, request);
    }

    private static final String ERROR_BAD_REQUEST = "Bad Request";
    private static final String ERROR_UNAUTHORIZED = "Unauthorized";
    private static final String ERROR_FORBIDDEN = "Forbidden";
    private static final String ERROR_CONFLICT = "Conflict";
    private static final String ERROR_NOT_FOUND = "Not Found";


    @ExceptionHandler(com.zaphirio.retailapi.auth.exception.ResourceNotFoundException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleNotFound(com.zaphirio.retailapi.auth.exception.ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return respond(HttpStatus.NOT_FOUND, ERROR_NOT_FOUND, ex, request);
    }

    @ExceptionHandler(EmailAlreadyExistException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleEmailAlreadyExist(EmailAlreadyExistException ex, HttpServletRequest request) {
        log.warn("Email already exists: {}", ex.getMessage());
        return respond(HttpStatus.CONFLICT, ERROR_CONFLICT, ex, request);
    }

    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleAuthenticationFailed(AuthenticationFailedException ex, HttpServletRequest request) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return respond(HttpStatus.UNAUTHORIZED, ERROR_UNAUTHORIZED, ex, request);
    }

    @ExceptionHandler(AccountNotVerifiedException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleAccountNotVerified(AccountNotVerifiedException ex, HttpServletRequest request) {
        log.warn("Account not verified: {}", ex.getMessage());
        return respond(HttpStatus.FORBIDDEN, ERROR_FORBIDDEN, ex, request);
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleAccountLocked(AccountLockedException ex, HttpServletRequest request) {
        log.warn("Account locked: {}", ex.getMessage());
        return respond(HttpStatus.FORBIDDEN, ERROR_FORBIDDEN, ex, request);
    }

    @ExceptionHandler(UnauthorizedActionException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleUnauthorizedAction(UnauthorizedActionException ex, HttpServletRequest request) {
        log.warn("Unauthorized action: {}", ex.getMessage());
        return respond(HttpStatus.FORBIDDEN, ERROR_FORBIDDEN, ex, request);
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleInvalidToken(InvalidTokenException ex, HttpServletRequest request) {
        log.warn("Invalid token: {}", ex.getMessage());
        return respond(HttpStatus.UNAUTHORIZED, ERROR_UNAUTHORIZED, ex, request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied to {}: {}", request.getRequestURI(), ex.getMessage());
        return respond(HttpStatus.FORBIDDEN, ERROR_FORBIDDEN, "Access Denied: You do not have permission to access this resource", request);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleAuthenticationException(AuthenticationException ex, HttpServletRequest request) {
        log.warn("Authentication failed for {}: {}", request.getRequestURI(), ex.getMessage());
        return respond(HttpStatus.UNAUTHORIZED, ERROR_UNAUTHORIZED, "Authentication Failed: Invalid credentials or missing authentication token", request);
    }

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleExternalService(ExternalServiceException ex, HttpServletRequest request) {
        log.error("External service error: {}", ex.getMessage());
        return respond(HttpStatus.BAD_GATEWAY, "External Service Error", ex, request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String message = "Invalid value for parameter '" + ex.getName() + "'";
        log.warn("Type mismatch: {}", message);
        return respond(HttpStatus.BAD_REQUEST, "Validation Error", message, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleUnreadableMessage(HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed request body: {}", ex.getMessage());
        return respond(HttpStatus.BAD_REQUEST, ERROR_BAD_REQUEST, "Malformed or unreadable request body", request);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleEntityNotFound(EntityNotFoundException ex, HttpServletRequest request) {
        log.warn("Entity not found: {}", ex.getMessage());
        return respond(HttpStatus.NOT_FOUND, ERROR_NOT_FOUND, ex, request);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleMissingPart(MissingServletRequestPartException ex, HttpServletRequest request) {
        log.warn("Missing request part: {}", ex.getMessage());
        return respond(HttpStatus.BAD_REQUEST, ERROR_BAD_REQUEST, ex, request);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        log.warn("Unsupported media type: {}", ex.getMessage());
        return respond(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported Media Type", ex, request);
    }

    private ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> respond(HttpStatusCode status, String error, Exception ex, HttpServletRequest request) {
        return respond(status, error, ex.getMessage(), request);
    }

    private ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> respond(HttpStatusCode status, String error, String message, HttpServletRequest request) {
        com.zaphirio.retailapi.auth.exception.ApiError apiError = new com.zaphirio.retailapi.auth.exception.ApiError(Instant.now(), status.value(), error, message, request.getRequestURI());
        return ResponseEntity.status(status).body(apiError);
    }
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_CONTENT)
    public ApiError handleBusinessException(BusinessException ex, HttpServletRequest request) {
        log.warn("Business rule violation: {}", ex.getMessage());
        return build(HttpStatus.UNPROCESSABLE_CONTENT, "Business Rule Violation", ex, request);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiError handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", ex, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<com.zaphirio.retailapi.auth.exception.ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + " " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));

        log.warn("Validation error: {}", message);
        return respond(HttpStatus.BAD_REQUEST, "Validation Error", message, request);
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