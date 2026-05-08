package vn.kaori.spa.shared.error;

/**
 * Centralised error code catalogue. Codes are stable contract — never rename
 * or repurpose, only deprecate. Frontend i18n maps them to localised messages.
 */
public final class ErrorCodes {
    public static final String AUTH_BAD_CREDENTIALS = "AUTH_BAD_CREDENTIALS";
    public static final String AUTH_TOKEN_EXPIRED   = "AUTH_TOKEN_EXPIRED";
    public static final String AUTH_TOKEN_INVALID   = "AUTH_TOKEN_INVALID";
    public static final String AUTH_2FA_REQUIRED    = "AUTH_2FA_REQUIRED";
    public static final String AUTH_2FA_INVALID     = "AUTH_2FA_INVALID";
    public static final String AUTH_LOCKED          = "AUTH_LOCKED";

    public static final String PERM_DENIED          = "PERM_DENIED";
    public static final String TENANT_MISMATCH      = "TENANT_MISMATCH";

    public static final String VALIDATION_FAILED    = "VALIDATION_FAILED";
    public static final String NOT_FOUND            = "NOT_FOUND";
    public static final String CONFLICT             = "CONFLICT";
    public static final String IDEMPOTENCY_REPLAY   = "IDEMPOTENCY_REPLAY";

    public static final String BOOKING_SLOT_TAKEN   = "BOOKING_SLOT_TAKEN";
    public static final String BOOKING_STAFF_BUSY   = "BOOKING_STAFF_BUSY";
    public static final String BOOKING_ROOM_BUSY    = "BOOKING_ROOM_BUSY";

    public static final String INTERNAL             = "INTERNAL";

    private ErrorCodes() {}
}
