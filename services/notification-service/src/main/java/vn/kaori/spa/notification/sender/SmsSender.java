package vn.kaori.spa.notification.sender;

public interface SmsSender {
    /** Returns the provider's message SID. */
    String send(String toPhone, String body);

    String name();
}
