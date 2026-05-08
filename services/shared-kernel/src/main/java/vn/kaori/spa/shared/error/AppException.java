package vn.kaori.spa.shared.error;

import org.springframework.http.HttpStatus;

/**
 * Base for any business / domain exception thrown by Kaori services.
 * The exception code maps 1-1 to a key in i18n message bundles.
 */
public class AppException extends RuntimeException {
    private final String code;
    private final HttpStatus status;
    private final transient Object fields;

    public AppException(String code, HttpStatus status, String message) {
        this(code, status, message, null);
    }

    public AppException(String code, HttpStatus status, String message, Object fields) {
        super(message);
        this.code = code;
        this.status = status;
        this.fields = fields;
    }

    public String getCode() { return code; }
    public HttpStatus getStatus() { return status; }
    public Object getFields() { return fields; }
}
