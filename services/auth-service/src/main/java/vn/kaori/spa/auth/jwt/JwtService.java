package vn.kaori.spa.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    @Getter private final String issuer;
    @Getter private final long accessTtlMinutes;
    @Getter private final long refreshTtlDays;

    public JwtService(
            @Value("${kaori.jwt.secret}") String secret,
            @Value("${kaori.jwt.issuer}") String issuer,
            @Value("${kaori.jwt.access-ttl-minutes}") long accessTtlMinutes,
            @Value("${kaori.jwt.refresh-ttl-days}") long refreshTtlDays
    ) {
        byte[] keyBytes = secret.length() < 64
                ? secret.getBytes(StandardCharsets.UTF_8)
                : Decoders.BASE64.decode(secret);
        this.key = Keys.hmacShaKeyFor(keyBytes.length >= 32 ? keyBytes : padTo32(keyBytes));
        this.issuer = issuer;
        this.accessTtlMinutes = accessTtlMinutes;
        this.refreshTtlDays = refreshTtlDays;
    }

    public String issueAccessToken(UUID userId, UUID tenantId, UUID orgId, UUID branchId,
                                   String locale, Set<String> roles, Set<String> permissions) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(issuer)
                .subject(userId.toString())
                .issuedAt(java.util.Date.from(now))
                .expiration(java.util.Date.from(now.plus(accessTtlMinutes, ChronoUnit.MINUTES)))
                .claims(Map.of(
                        "tid", tenantId.toString(),
                        "oid", orgId == null ? "" : orgId.toString(),
                        "bid", branchId == null ? "" : branchId.toString(),
                        "loc", locale == null ? "vi" : locale,
                        "roles", roles,
                        "perms", permissions
                ))
                .signWith(key)
                .compact();
    }

    public String issueRefreshToken(UUID userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(issuer)
                .subject(userId.toString())
                .issuedAt(java.util.Date.from(now))
                .expiration(java.util.Date.from(now.plus(refreshTtlDays, ChronoUnit.DAYS)))
                .id(UUID.randomUUID().toString())
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(issuer)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException ex) {
            throw new AppException(
                    ErrorCodes.AUTH_TOKEN_INVALID,
                    HttpStatus.UNAUTHORIZED,
                    "Invalid or expired token"
            );
        }
    }

    private static byte[] padTo32(byte[] in) {
        byte[] out = new byte[32];
        System.arraycopy(in, 0, out, 0, Math.min(in.length, 32));
        return out;
    }
}
