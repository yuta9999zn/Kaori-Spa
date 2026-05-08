package vn.kaori.spa.auth.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.auth.domain.User2fa;
import vn.kaori.spa.auth.domain.User2faRepository;
import vn.kaori.spa.auth.twofa.TotpService;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;
import vn.kaori.spa.shared.security.TenantContext;

import java.util.UUID;

/**
 * 2FA setup + verify. Two-step flow:
 *
 *   1. POST /v1/auth/2fa/setup
 *        Generate secret + QR PNG. Returns secret for the authenticator app to
 *        scan. Persists with enabled=false.
 *
 *   2. POST /v1/auth/2fa/verify { code }
 *        On success, flips enabled=true. From then on the login flow demands
 *        the OTP step before issuing tokens.
 */
@RestController
@RequestMapping("/v1/auth/2fa")
@RequiredArgsConstructor
public class TwoFaController {

    private final TotpService totp;
    private final User2faRepository repo;

    public record SetupResponse(String secret, String qrPng) {}
    public record VerifyReq(@NotBlank String code) {}

    @PostMapping("/setup")
    @PreAuthorize("isAuthenticated()")
    @Audited(action = "2fa.setup", entityType = "user_2fa")
    public ApiResponse<SetupResponse> setup() {
        UUID uid = currentUserId();
        String secret = totp.newSecret();
        repo.save(new User2fa(uid, secret));
        // email — fall back to "user@kaori" if not in context.
        String label = "user-" + uid.toString().substring(0, 8) + "@kaori";
        return ApiResponse.ok(new SetupResponse(secret, totp.qrPngBase64(label, secret)));
    }

    @PostMapping("/verify")
    @PreAuthorize("isAuthenticated()")
    @Audited(action = "2fa.verify", entityType = "user_2fa")
    public ApiResponse<Void> verify(@Valid @RequestBody VerifyReq req) {
        UUID uid = currentUserId();
        User2fa f = repo.findById(uid)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "2FA not set up"));
        if (!totp.verify(f.getSecret(), req.code())) {
            throw new AppException(ErrorCodes.AUTH_2FA_INVALID, HttpStatus.UNAUTHORIZED, "Invalid OTP");
        }
        f.setEnabled(true);
        repo.save(f);
        return ApiResponse.ok(null);
    }

    @PostMapping("/disable")
    @PreAuthorize("isAuthenticated()")
    @Audited(action = "2fa.disable", entityType = "user_2fa")
    public ApiResponse<Void> disable(@Valid @RequestBody VerifyReq req) {
        UUID uid = currentUserId();
        User2fa f = repo.findById(uid)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "2FA not set up"));
        if (!totp.verify(f.getSecret(), req.code())) {
            throw new AppException(ErrorCodes.AUTH_2FA_INVALID, HttpStatus.UNAUTHORIZED, "Invalid OTP");
        }
        repo.delete(f);
        return ApiResponse.ok(null);
    }

    private UUID currentUserId() {
        var p = TenantContext.get();
        if (p == null || p.userId() == null) {
            throw new AppException(ErrorCodes.AUTH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        return p.userId();
    }
}
