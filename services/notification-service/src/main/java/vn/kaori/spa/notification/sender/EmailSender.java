package vn.kaori.spa.notification.sender;

public interface EmailSender {
    /** Returns the provider's message id when sent successfully. */
    String send(String toAddress, String subject, String body);

    String name();
}
