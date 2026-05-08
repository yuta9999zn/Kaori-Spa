package vn.kaori.spa.auth.jwt;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Refresh tokens are stored hashed (SHA-256). This is fine because the token
 * itself has 256 bits of entropy from JJWT — we just need a constant-time
 * lookup, not password-grade hashing.
 */
@Component
public class TokenHasher {

    public String sha256(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] out = md.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(out);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
