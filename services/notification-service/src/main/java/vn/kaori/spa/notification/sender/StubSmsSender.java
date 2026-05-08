package vn.kaori.spa.notification.sender;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@ConditionalOnProperty(name = "kaori.sms.provider", havingValue = "stub", matchIfMissing = true)
@Slf4j
public class StubSmsSender implements SmsSender {
    @Override public String name() { return "stub-sms"; }

    @Override
    public String send(String to, String body) {
        String id = "stub-" + UUID.randomUUID();
        log.info("SMS[stub] to={} body={} id={}", to, body, id);
        return id;
    }
}
