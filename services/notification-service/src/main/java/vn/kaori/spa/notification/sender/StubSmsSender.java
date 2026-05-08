package vn.kaori.spa.notification.sender;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@ConditionalOnMissingBean(SmsSender.class)
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
