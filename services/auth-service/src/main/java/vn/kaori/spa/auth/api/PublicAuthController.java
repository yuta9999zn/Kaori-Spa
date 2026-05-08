package vn.kaori.spa.auth.api;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.auth.domain.User;
import vn.kaori.spa.auth.domain.UserRepository;
import vn.kaori.spa.auth.security.PasswordHasher;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.util.Set;
import java.util.UUID;

/**
 * Public-facing endpoints for end-customers who self-register on the
 * tenant's client website. Phone-first because that's the Vietnamese
 * convention; email is optional.
 *
 * Note: phone-OTP login (the typical Vietnamese flow) is on the roadmap;
 * for now we use password login same as staff.
 */
@RestController
@RequestMapping("/v1/public/auth")
@RequiredArgsConstructor
public class PublicAuthController {

    private final UserRepository userRepository;
    private final PasswordHasher hasher;
    private final SessionService sessionService;

    public record SignupReq(
            @NotNull UUID tenantId,
            @NotBlank @Pattern(regexp = "^[+0-9 ()-]{8,20}$") String phone,
            String email,
            @NotBlank @Size(min = 8) String password,
            String locale
    ) {}

    public record LoginByPhoneReq(
            @NotNull UUID tenantId,
            @NotBlank String phone,
            @NotBlank String password
    ) {}

    public record TokenResponse(String accessToken, String refreshToken, long expiresIn) {}

    @PostMapping("/signup")
    public ApiResponse<TokenResponse> signup(@Valid @RequestBody SignupReq req,
                                             HttpServletRequest http) {
        var existing = userRepository.findByTenantIdAndPhoneAndDeletedAtIsNull(req.tenantId(), req.phone());
        if (existing.isPresent()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "Số điện thoại đã được đăng ký");
        }

        User u = new User(req.tenantId(), req.email(), req.phone(), hasher.hash(req.password()));
        if (req.locale() != null) u.setLocale(req.locale());
        userRepository.save(u);

        Set<String> roles = Set.of("CUSTOMER");
        Set<String> perms = Set.of("booking:read", "booking:create");
        var pair = sessionService.createSession(
                u.getId(), http.getRemoteAddr(), http.getHeader("User-Agent"),
                u.getTenantId(), null, null, u.getLocale(), roles, perms
        );
        return ApiResponse.ok(new TokenResponse(pair.accessToken(), pair.refreshToken(), pair.accessExpiresIn()));
    }

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginByPhoneReq req,
                                            HttpServletRequest http) {
        User u = userRepository.findByTenantIdAndPhoneAndDeletedAtIsNull(req.tenantId(), req.phone())
                .orElseThrow(() -> new AppException(ErrorCodes.AUTH_BAD_CREDENTIALS,
                        HttpStatus.UNAUTHORIZED, "Phone or password incorrect"));

        if (u.isLocked()) {
            throw new AppException(ErrorCodes.AUTH_LOCKED, HttpStatus.FORBIDDEN, "Account locked");
        }
        if (!hasher.verify(u.getPasswordHash(), req.password())) {
            throw new AppException(ErrorCodes.AUTH_BAD_CREDENTIALS,
                    HttpStatus.UNAUTHORIZED, "Phone or password incorrect");
        }

        Set<String> roles = Set.of("CUSTOMER");
        Set<String> perms = Set.of("booking:read", "booking:create");
        var pair = sessionService.createSession(
                u.getId(), http.getRemoteAddr(), http.getHeader("User-Agent"),
                u.getTenantId(), null, null, u.getLocale(), roles, perms
        );
        return ApiResponse.ok(new TokenResponse(pair.accessToken(), pair.refreshToken(), pair.accessExpiresIn()));
    }
}
