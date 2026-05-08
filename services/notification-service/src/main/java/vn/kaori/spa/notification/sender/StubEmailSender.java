package vn.kaori.spa.notification.sender;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Fallback when no real email provider is configured. Logs the message and
 * returns a fake id so dev / CI environments don't blow up.
 */
@Component
@ConditionalOnProperty(name = "kaori.email.provider", havingValue = "stub", matchIfMissing = true)
@Slf4j
public class StubEmailSender implements EmailSender {
    @Override public String name() { return "stub-email"; }

    @Override
    public String send(String to, String subject, String body) {
        String id = "stub-" + UUID.randomUUID();
        log.info("EMAIL[stub] to={} subject={} bodyLen={} id={}", to, subject, body.length(), id);
        return id;
    }
}
