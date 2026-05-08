package vn.kaori.spa.auth.twofa;

import dev.samstevens.totp.code.*;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.stereotype.Service;

import java.util.Base64;

/**
 * RFC 6238 TOTP wrapper. 30-second window, 6-digit code, ±1 step tolerance.
 * Issuer label is "Kaori Spa" so the entry shows up in Google/Microsoft
 * Authenticator with that name.
 */
@Service
public class TotpService {

    private final SecretGenerator secretGen = new DefaultSecretGenerator(32);
    private final QrGenerator qrGen = new ZxingPngQrGenerator();
    private final CodeVerifier verifier =
            new DefaultCodeVerifier(new DefaultCodeGenerator(), new SystemTimeProvider());

    public String newSecret() {
        return secretGen.generate();
    }

    /** Returns base64-encoded PNG of the otpauth:// QR. */
    public String qrPngBase64(String email, String secret) {
        QrData data = new QrData.Builder()
                .label(email)
                .secret(secret)
                .issuer("Kaori Spa")
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        try {
            byte[] png = qrGen.generate(data);
            return Base64.getEncoder().encodeToString(png);
        } catch (Exception ex) {
            throw new IllegalStateException("QR generation failed", ex);
        }
    }

    public boolean verify(String secret, String code) {
        return verifier.isValidCode(secret, code);
    }
}
