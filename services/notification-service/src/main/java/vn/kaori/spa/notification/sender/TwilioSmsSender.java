package vn.kaori.spa.notification.sender;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "kaori.sms.provider", havingValue = "twilio")
@Slf4j
public class TwilioSmsSender implements SmsSender {

    @Value("${kaori.sms.twilio.sid}")     private String accountSid;
    @Value("${kaori.sms.twilio.token}")   private String authToken;
    @Value("${kaori.sms.twilio.from}")    private String fromNumber;

    @PostConstruct
    void init() {
        Twilio.init(accountSid, authToken);
    }

    @Override public String name() { return "twilio"; }

    @Override
    public String send(String to, String body) {
        var msg = Message.creator(new PhoneNumber(to), new PhoneNumber(fromNumber), body).create();
        return msg.getSid();
    }
}
