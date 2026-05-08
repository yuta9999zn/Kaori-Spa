package vn.kaori.spa.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import vn.kaori.spa.auth.domain.User;
import vn.kaori.spa.auth.domain.UserRepository;
import vn.kaori.spa.auth.security.PasswordHasher;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class AuthFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired TestRestTemplate http;
    @Autowired UserRepository userRepository;
    @Autowired PasswordHasher hasher;

    @Test
    void login_then_refresh_then_logout() {
        UUID tenantId = UUID.randomUUID();
        User u = new User(tenantId, "miko@naturalbeauty.vn", "+84-901-575-575",
                hasher.hash("Manager@2026"));
        userRepository.save(u);

        // 1. Login
        Map<String, Object> loginBody = Map.of(
                "tenantId", tenantId.toString(),
                "email", "miko@naturalbeauty.vn",
                "password", "Manager@2026"
        );
        ResponseEntity<Map> login = http.postForEntity("/v1/auth/login", json(loginBody), Map.class);
        assertThat(login.getStatusCode().is2xxSuccessful()).isTrue();
        Map<String, Object> body = (Map<String, Object>) login.getBody().get("data");
        String access  = (String) body.get("accessToken");
        String refresh = (String) body.get("refreshToken");
        assertThat(access).isNotEmpty();
        assertThat(refresh).isNotEmpty();

        // 2. Refresh — old refresh becomes invalid (single-use)
        ResponseEntity<Map> rotate = http.postForEntity("/v1/auth/refresh",
                json(Map.of("refreshToken", refresh)), Map.class);
        assertThat(rotate.getStatusCode().is2xxSuccessful()).isTrue();
        String newRefresh = (String) ((Map<?, ?>) rotate.getBody().get("data")).get("refreshToken");
        assertThat(newRefresh).isNotEqualTo(refresh);

        // 3. Re-using old refresh must fail.
        ResponseEntity<Map> reuse = http.postForEntity("/v1/auth/refresh",
                json(Map.of("refreshToken", refresh)), Map.class);
        assertThat(reuse.getStatusCode().value()).isEqualTo(401);

        // 4. Logout new refresh.
        ResponseEntity<Map> logout = http.postForEntity("/v1/auth/logout",
                json(Map.of("refreshToken", newRefresh)), Map.class);
        assertThat(logout.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    void wrong_password_increments_attempts_and_locks_after_10() {
        UUID tenantId = UUID.randomUUID();
        userRepository.save(new User(tenantId, "lock@nb.vn", null, hasher.hash("Right@1234")));

        for (int i = 0; i < 10; i++) {
            ResponseEntity<Map> r = http.postForEntity("/v1/auth/login",
                    json(Map.of("tenantId", tenantId.toString(),
                            "email", "lock@nb.vn",
                            "password", "Wrong@9999")),
                    Map.class);
            assertThat(r.getStatusCode().value()).isEqualTo(401);
        }

        // 11th attempt — even with right password account is locked.
        ResponseEntity<Map> final11 = http.postForEntity("/v1/auth/login",
                json(Map.of("tenantId", tenantId.toString(),
                        "email", "lock@nb.vn",
                        "password", "Right@1234")),
                Map.class);
        assertThat(final11.getStatusCode().value()).isEqualTo(403);
    }

    private HttpEntity<Map<String, Object>> json(Map<String, Object> body) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, h);
    }
}
