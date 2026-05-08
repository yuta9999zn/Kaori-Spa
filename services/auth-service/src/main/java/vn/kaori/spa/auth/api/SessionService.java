package vn.kaori.spa.auth.api;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.kaori.spa.auth.domain.Session;
import vn.kaori.spa.auth.domain.SessionRepository;
import vn.kaori.spa.auth.domain.User;
import vn.kaori.spa.auth.domain.UserRepository;
import vn.kaori.spa.auth.jwt.JwtService;
import vn.kaori.spa.auth.jwt.TokenHasher;
import vn.kaori.spa.auth.rbac.UserAccessResolver;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;

/**
 * Encapsulates session lifecycle: create after login, rotate on refresh,
 * revoke on logout. Refresh-token rotation invalidates the previous token
 * immediately (single-use).
 */
@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final JwtService jwt;
    private final TokenHasher hasher;
    private final UserAccessResolver accessResolver;

    public record TokenPair(String accessToken, String refreshToken, long accessExpiresIn) {}

    @Transactional
    public TokenPair createSession(UUID userId, String ip, String userAgent,
                                   UUID tenantId, UUID orgId, UUID branchId,
                                   String locale, Set<String> roles, Set<String> perms) {
        String refresh = jwt.issueRefreshToken(userId);
        sessionRepository.save(new Session(
                userId,
                hasher.sha256(refresh),
                ip,
                userAgent,
                Instant.now().plus(jwt.getRefreshTtlDays(), ChronoUnit.DAYS)
        ));
        String access = jwt.issueAccessToken(userId, tenantId, orgId, branchId, locale, roles, perms);
        return new TokenPair(access, refresh, jwt.getAccessTtlMinutes() * 60);
    }

    @Transactional
    public TokenPair rotate(String refreshToken, String ip, String userAgent) {
        Claims claims = jwt.parse(refreshToken);
        UUID userId = UUID.fromString(claims.getSubject());

        String tokenHash = hasher.sha256(refreshToken);
        Session session = sessionRepository.findByRefreshTokenHashAndRevokedAtIsNull(tokenHash)
                .orElseThrow(() -> new AppException(
                        ErrorCodes.AUTH_TOKEN_INVALID,
                        HttpStatus.UNAUTHORIZED,
                        "Refresh token not found or already revoked"
                ));

        if (!session.isActive()) {
            throw new AppException(
                    ErrorCodes.AUTH_TOKEN_EXPIRED,
                    HttpStatus.UNAUTHORIZED,
                    "Session expired"
            );
        }

        // Single-use: revoke old, issue new pair.
        session.setRevokedAt(Instant.now());
        sessionRepository.save(session);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(
                        ErrorCodes.AUTH_TOKEN_INVALID,
                        HttpStatus.UNAUTHORIZED,
                        "User not found"
                ));

        // Re-resolve RBAC on rotation so role/permission changes since last login take
        // effect on the next access token (no need to wait for a fresh login).
        UserAccessResolver.AccessProfile profile = accessResolver.resolve(user.getId());

        return createSession(user.getId(), ip, userAgent,
                user.getTenantId(), profile.orgId(), profile.branchId(),
                user.getLocale(), profile.roles(), profile.permissions());
    }

    @Transactional
    public void revoke(String refreshToken) {
        sessionRepository.findByRefreshTokenHashAndRevokedAtIsNull(hasher.sha256(refreshToken))
                .ifPresent(s -> { s.setRevokedAt(Instant.now()); sessionRepository.save(s); });
    }
}
