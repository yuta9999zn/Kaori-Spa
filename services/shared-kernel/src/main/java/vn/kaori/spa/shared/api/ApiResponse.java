package vn.kaori.spa.shared.api;

import java.time.Instant;
import java.util.UUID;

/**
 * Standard envelope returned by every Kaori HTTP endpoint.
 * Either {@code data} or {@code error} is non-null, never both.
 */
public record ApiResponse<T>(
        boolean success,
        T data,
        ApiError error,
        ApiMeta meta
) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, ApiMeta.now());
    }

    public static <T> ApiResponse<T> ok(T data, ApiMeta meta) {
        return new ApiResponse<>(true, data, null, meta);
    }

    public static <T> ApiResponse<T> fail(ApiError error) {
        return new ApiResponse<>(false, null, error, ApiMeta.now());
    }

    public record ApiError(
            String code,
            String message,
            String detail,
            Object fields
    ) {}

    public record ApiMeta(
            Instant ts,
            UUID traceId,
            Integer page,
            Integer size,
            Long total
    ) {
        public static ApiMeta now() {
            return new ApiMeta(Instant.now(), null, null, null, null);
        }
    }
}
