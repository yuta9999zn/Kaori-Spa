package vn.kaori.spa.notification.listener;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.kaori.spa.notification.domain.Notification;
import vn.kaori.spa.notification.domain.NotificationRepository;
import vn.kaori.spa.notification.template.TemplateRenderer;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Subscribes to canonical Kaori domain events and writes one
 * {@link Notification} row per recipient.
 *
 * Recipient resolution policy (initial — refine when role-resolution lands):
 *   - booking.created → all RECEPTIONIST + BRANCH_MANAGER of the branch
 *   - booking.cancelled / completed → assigned therapist + manager
 *   - payment.completed → ACCOUNTANT + BRANCH_MANAGER of the branch
 *
 * For now, since the auth-service hasn't shipped the role lookup API yet,
 * we use a placeholder query against the auth.user_roles table directly.
 * Replace with a proper /v1/users/by-role?branch&role= call later.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationFanout {

    private final NotificationRepository repo;
    private final TemplateRenderer renderer;
    private final ObjectMapper mapper = new ObjectMapper();

    @PersistenceContext
    private EntityManager em;

    @KafkaListener(topics = "kaori.booking.created.v1", groupId = "notification-fanout")
    @Transactional
    public void onBookingCreated(String payload) {
        JsonNode n = parse(payload);
        if (n == null) return;
        UUID tenantId = uuid(n, "tenantId");
        UUID branchId = uuid(n, "branchId");
        if (tenantId == null || branchId == null) return;

        Map<String, Object> data = new HashMap<>();
        data.put("bookingId", text(n, "bookingId"));
        data.put("code",      text(n, "code"));
        data.put("startAt",   text(n, "startAt"));

        for (UUID userId : recipientsForBranch(branchId, List.of("BRANCH_MANAGER", "RECEPTIONIST"))) {
            persist(userId, tenantId, branchId,
                    "booking.created",
                    "Booking mới — " + text(n, "code"),
                    text(n, "customer") + " · " + (text(n, "startAt") == null ? "" : text(n, "startAt")),
                    "info",
                    "/booking/" + text(n, "bookingId"),
                    data);
        }
    }

    @KafkaListener(topics = "kaori.booking.cancelled.v1", groupId = "notification-fanout")
    @Transactional
    public void onBookingCancelled(String payload) {
        JsonNode n = parse(payload);
        if (n == null) return;
        UUID tenantId = uuid(n, "tenantId");
        UUID branchId = uuid(n, "branchId");
        if (tenantId == null || branchId == null) return;

        Map<String, Object> data = Map.of("bookingId", text(n, "bookingId"));
        for (UUID userId : recipientsForBranch(branchId, List.of("BRANCH_MANAGER", "RECEPTIONIST"))) {
            persist(userId, tenantId, branchId,
                    "booking.cancelled",
                    "Booking " + text(n, "code") + " đã huỷ",
                    text(n, "customer"),
                    "warn",
                    "/booking/" + text(n, "bookingId"),
                    data);
        }
    }

    @KafkaListener(topics = "kaori.payment.completed.v1", groupId = "notification-fanout")
    @Transactional
    public void onPaymentCompleted(String payload) {
        JsonNode n = parse(payload);
        if (n == null) return;
        UUID tenantId = uuid(n, "tenantId");
        UUID branchId = uuid(n, "branchId");
        if (tenantId == null) return;

        for (UUID userId : recipientsForBranch(branchId, List.of("BRANCH_MANAGER", "ACCOUNTANT"))) {
            persist(userId, tenantId, branchId,
                    "payment.completed",
                    "Thanh toán " + text(n, "amount"),
                    text(n, "customer"),
                    "success",
                    "/booking/" + text(n, "bookingId"),
                    Map.of("amount", text(n, "amount")));
        }
    }

    /** Lookup users with one of the given role codes scoped to the branch. */
    @SuppressWarnings("unchecked")
    private List<UUID> recipientsForBranch(UUID branchId, List<String> roles) {
        try {
            return (List<UUID>) em.createNativeQuery("""
                SELECT DISTINCT ur.user_id
                FROM auth.user_roles ur
                JOIN auth.roles r ON r.id = ur.role_id
                WHERE r.code IN (:roles)
                  AND (ur.scope_branch_id = :branchId OR ur.scope_branch_id IS NULL)
                """)
                .setParameter("roles", roles)
                .setParameter("branchId", branchId)
                .getResultList();
        } catch (Exception ex) {
            log.warn("Recipient lookup failed (auth schema not joined yet): {}", ex.getMessage());
            return List.of();
        }
    }

    private void persist(UUID userId, UUID tenantId, UUID branchId,
                         String kind, String title, String body,
                         String severity, String deepLink,
                         Map<String, Object> payload) {
        try {
            Notification n = new Notification();
            n.setTenantId(tenantId);
            n.setBranchId(branchId);
            n.setUserId(userId);
            n.setKind(kind);
            n.setTitle(title);
            n.setBody(body);
            n.setSeverity(severity);
            n.setDeepLink(deepLink);
            n.setPayload(payload == null ? Map.of() : payload);
            repo.save(n);
        } catch (Exception ex) {
            log.error("Failed to persist notification kind={} user={}", kind, userId, ex);
        }
    }

    private JsonNode parse(String s) {
        try { return mapper.readTree(s); }
        catch (Exception ex) { log.warn("bad json: {}", s, ex); return null; }
    }

    private static String text(JsonNode n, String f) {
        JsonNode v = n.get(f);
        return v == null || v.isNull() ? null : v.asText();
    }

    private static UUID uuid(JsonNode n, String f) {
        String s = text(n, f);
        try { return s == null ? null : UUID.fromString(s); }
        catch (IllegalArgumentException ex) { return null; }
    }
}
