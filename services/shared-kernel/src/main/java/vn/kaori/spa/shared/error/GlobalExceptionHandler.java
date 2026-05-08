package vn.kaori.spa.shared.error;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import vn.kaori.spa.shared.api.ApiResponse;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> onAppException(AppException ex) {
        log.warn("AppException [{}] {}", ex.getCode(), ex.getMessage());
        return ResponseEntity.status(ex.getStatus()).body(
                ApiResponse.fail(new ApiResponse.ApiError(
                        ex.getCode(), ex.getMessage(), null, ex.getFields()
                ))
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> onValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
                fields.put(fe.getField(), fe.getDefaultMessage()));
        return ResponseEntity.badRequest().body(
                ApiResponse.fail(new ApiResponse.ApiError(
                        ErrorCodes.VALIDATION_FAILED, "Validation failed", null, fields
                ))
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> onConstraint(ConstraintViolationException ex) {
        return ResponseEntity.badRequest().body(
                ApiResponse.fail(new ApiResponse.ApiError(
                        ErrorCodes.VALIDATION_FAILED, ex.getMessage(), null, null
                ))
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> onForbidden(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                ApiResponse.fail(new ApiResponse.ApiError(
                        ErrorCodes.PERM_DENIED, "Permission denied", null, null
                ))
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> onGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ApiResponse.fail(new ApiResponse.ApiError(
                        ErrorCodes.INTERNAL, "Internal server error", null, null
                ))
        );
    }
}
