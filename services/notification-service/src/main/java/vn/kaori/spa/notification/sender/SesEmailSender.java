package vn.kaori.spa.notification.sender;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

/**
 * AWS SES adapter. Active only when {@code kaori.email.provider=ses}.
 * Uses the ambient AWS credentials chain (env, instance profile, etc.).
 */
@Component
@ConditionalOnProperty(name = "kaori.email.provider", havingValue = "ses")
@Slf4j
public class SesEmailSender implements EmailSender {

    private final SesClient client = SesClient.create();

    @Value("${kaori.email.from}")
    private String from;

    @Override public String name() { return "ses"; }

    @Override
    public String send(String to, String subject, String body) {
        try {
            var resp = client.sendEmail(SendEmailRequest.builder()
                    .source(from)
                    .destination(Destination.builder().toAddresses(to).build())
                    .message(Message.builder()
                            .subject(Content.builder().charset("UTF-8").data(subject).build())
                            .body(Body.builder()
                                    .text(Content.builder().charset("UTF-8").data(body).build())
                                    .build())
                            .build())
                    .build());
            return resp.messageId();
        } catch (SesException ex) {
            log.error("SES send failed to {}: {}", to, ex.awsErrorDetails().errorMessage());
            throw ex;
        }
    }
}
