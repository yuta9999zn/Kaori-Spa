package vn.kaori.spa.auth.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.auth.domain.User;
import vn.kaori.spa.auth.domain.User2faRepository;
import vn.kaori.spa.auth.domain.UserRepository;
import vn.kaori.spa.auth.rbac.UserAccessResolver;
import vn.kaori.spa.auth.security.PasswordHasher;
import vn.kaori.spa.auth.twofa.TotpService;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final User2faRepository user2faRepository;
    private final PasswordHasher hasher;
    private final SessionService sessionService;
    private final TotpService totp;
    private final LoginPendingService pendingService;
    private final UserAccessResolver accessResolver;

    public record LoginRequest(
            @NotBlank UUID tenantId,
            @Email String email,
            @NotBlank @Size(min = 8) String password
    ) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    /**
     * Login response. Two shapes:
     *   - Without 2FA: {@code step="ok"}, tokens populated.
     *   - With 2FA:    {@code step="2fa_required"}, only {@code pendingToken} set.
     * The frontend reads {@code step} to decide whether to show the OTP field.
     */
    public record TokenResponse(
            String step,
            String pendingToken,
            String accessToken,
            String refreshToken,
            long expiresIn,
            UserSummary user
    ) {}

    public record UserSummary(UUID id, String email, String locale, Set<String> roles) {}

    public record OtpRequest(@NotBlank String pendingToken, @NotBlank String code) {}

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest req,
                                            HttpServletRequest http) {
        User user = userRepository
                .findByTenantIdAndEmailAndDeletedAtIsNull(req.tenantId(), req.email())
                .orElseThrow(() -> new AppException(
                        ErrorCodes.AUTH_BAD_CREDENTIALS,
                        HttpStatus.UNAUTHORIZED,
                        "Email or password is incorrect"
                ));

        if (user.isLocked()) {
            throw new AppException(ErrorCodes.AUTH_LOCKED, HttpStatus.FORBIDDEN, "Account locked");
        }

        if (!hasher.verify(user.getPasswordHash(), req.password())) {
            user.setFailedAttempts(user.getFailedAttempts() + 1);
            if (user.getFailedAttempts() >= 10) {
                user.setLockedUntil(Instant.now().plus(10, ChronoUnit.MINUTES));
                user.setFailedAttempts(0);
            }
            userRepository.save(user);
            throw new AppException(
                    ErrorCodes.AUTH_BAD_CREDENTIALS,
                    HttpStatus.UNAUTHORIZED,
                    "Email or password is incorrect"
            );
        }

        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // Branch: if user has 2FA enabled, hold tokens until OTP step completes.
        var fa = user2faRepository.findById(user.getId()).orElse(null);
        if (fa != null && fa.isEnabled()) {
            String pending = pendingService.issue(user.getId());
            return ApiResponse.ok(new TokenResponse(
                    "2fa_required", pending, null, null, 0, null
            ));
        }

        return ApiResponse.ok(issueFor(user, http));
    }

    @PostMapping("/login/2fa")
    public ApiResponse<TokenResponse> verifyOtp(@Valid @RequestBody OtpRequest req,
                                                HttpServletRequest http) {
        UUID userId = pendingService.consume(req.pendingToken());
        var fa = user2faRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCodes.AUTH_2FA_INVALID,
                        HttpStatus.UNAUTHORIZED, "2FA not configured"));
        if (!totp.verify(fa.getSecret(), req.code())) {
            throw new AppException(ErrorCodes.AUTH_2FA_INVALID,
                    HttpStatus.UNAUTHORIZED, "Invalid OTP");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCodes.AUTH_TOKEN_INVALID,
                        HttpStatus.UNAUTHORIZED, "User missing"));
        return ApiResponse.ok(issueFor(user, http));
    }

    private TokenResponse issueFor(User user, HttpServletRequest http) {
        // Real RBAC: roles + perms + (org/branch) scope come from auth.user_roles join
        // auth.roles (and role_permissions). Falls back to CUSTOMER if no grants.
        UserAccessResolver.AccessProfile profile = accessResolver.resolve(user.getId());
        var pair = sessionService.createSession(
                user.getId(), http.getRemoteAddr(), http.getHeader("User-Agent"),
                user.getTenantId(), profile.orgId(), profile.branchId(),
                user.getLocale(), profile.roles(), profile.permissions()
        );
        return new TokenResponse(
                "ok", null,
                pair.accessToken(), pair.refreshToken(), pair.accessExpiresIn(),
                new UserSummary(user.getId(), user.getEmail(), user.getLocale(), profile.roles())
        );
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req,
                                              HttpServletRequest http) {
        var pair = sessionService.rotate(
                req.refreshToken(),
                http.getRemoteAddr(),
                http.getHeader("User-Agent")
        );
        return ApiResponse.ok(new TokenResponse(
                "ok", null,
                pair.accessToken(), pair.refreshToken(), pair.accessExpiresIn(),
                null
        ));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody RefreshRequest req) {
        sessionService.revoke(req.refreshToken());
        return ApiResponse.ok(null);
    }
}
