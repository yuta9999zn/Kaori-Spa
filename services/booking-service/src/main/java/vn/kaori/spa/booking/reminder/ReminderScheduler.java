package vn.kaori.spa.booking.reminder;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Sends booking reminder SMS at three lifecycle points:
 *
 *   1. confirmation — immediately after creation. ALSO acts as the safety net
 *      for last-minute bookings: if a customer books only 30 minutes before
 *      their appointment, the 24h and 1h windows have already passed, so we
 *      send a single confirmation message that doubles as the reminder.
 *   2. h24           — ~24h before start_at, only if the booking was created
 *      with at least 24h of lead time (otherwise the 24h moment is in the
 *      past and we skip — see WHERE clause).
 *   3. h1            — ~1h before start_at, only if the booking was created
 *      with at least 1h of lead time.
 *
 * Each reminder is idempotent via reminder_log (PK booking_id + kind), so
 * scheduler restarts or overlapping ticks never double-send.
 *
 * The scheduler doesn't render the SMS body itself — it publishes a Kafka
 * event onto `notification.send.v1`; notification-service picks the locale
 * template, expands placeholders and delivers via the configured SmsSender.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    @PersistenceContext
    private EntityManager em;

    private final KafkaTemplate<String, Object> kafka;

    @Value("${kaori.reminders.enabled:true}")
    private boolean enabled;

    @Value("${kaori.reminders.topic:notification.send.v1}")
    private String topic;

    /** Run every 5 minutes. The H24 / H1 filters are wide enough (75 min /
     *  15 min) so a 5-min cadence comfortably covers them with idempotent
     *  inserts as the safety net. */
    @Scheduled(fixedDelayString = "${kaori.reminders.fixed-delay-ms:300000}",
               initialDelay = 30_000)
    @Transactional
    public void tick() {
        if (!enabled) return;
        int conf = sendConfirmation();
        int h24  = sendH24();
        int h1   = sendH1();
        if (conf + h24 + h1 > 0) {
            log.info("Reminder tick: confirmation={} h24={} h1={}", conf, h24, h1);
        }
    }

    /**
     * Confirmation: any new booking that we have not yet sent a confirmation
     * for. We send it to everyone (lead-time agnostic), and notification-service
     * uses a different template for "your appointment is in <2h" vs the regular
     * "see you tomorrow" copy.
     */
    @SuppressWarnings("unchecked")
    int sendConfirmation() {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT b.id, b.tenant_id, b.branch_id, b.customer_phone, b.customer_locale,
                   b.start_at, b.code,
                   EXTRACT(EPOCH FROM (b.start_at - b.created_at))::bigint AS lead_seconds
            FROM booking.bookings b
            LEFT JOIN booking.reminder_log r
              ON r.booking_id = b.id AND r.kind = 'confirmation'
            WHERE r.booking_id IS NULL
              AND b.status IN ('pending','confirmed')
              AND b.created_at > now() - INTERVAL '1 hour'
              AND b.customer_phone IS NOT NULL
            ORDER BY b.created_at
            LIMIT 200
            """).getResultList();
        for (Object[] r : rows) {
            UUID bookingId = (UUID) r[0];
            long leadSec   = ((Number) r[7]).longValue();
            String kind = leadSec < 2 * 3600 ? "confirmation_imminent" : "confirmation";
            publish(r, kind);
            markSent(bookingId, "confirmation");
        }
        return rows.size();
    }

    /** 24h-before reminder. Skips bookings created with less than 24h lead time. */
    @SuppressWarnings("unchecked")
    int sendH24() {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT b.id, b.tenant_id, b.branch_id, b.customer_phone, b.customer_locale,
                   b.start_at, b.code, NULL::bigint
            FROM booking.bookings b
            LEFT JOIN booking.reminder_log r
              ON r.booking_id = b.id AND r.kind = 'h24'
            WHERE r.booking_id IS NULL
              AND b.status IN ('pending','confirmed')
              AND b.start_at BETWEEN now() + INTERVAL '23 hours'
                                 AND now() + INTERVAL '25 hours'
              AND b.start_at - b.created_at >= INTERVAL '24 hours'
              AND b.customer_phone IS NOT NULL
            LIMIT 500
            """).getResultList();
        for (Object[] r : rows) {
            publish(r, "reminder_h24");
            markSent((UUID) r[0], "h24");
        }
        return rows.size();
    }

    /** 1h-before reminder. Skips bookings created with less than 1h lead time. */
    @SuppressWarnings("unchecked")
    int sendH1() {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT b.id, b.tenant_id, b.branch_id, b.customer_phone, b.customer_locale,
                   b.start_at, b.code, NULL::bigint
            FROM booking.bookings b
            LEFT JOIN booking.reminder_log r
              ON r.booking_id = b.id AND r.kind = 'h1'
            WHERE r.booking_id IS NULL
              AND b.status IN ('confirmed','pending')
              AND b.start_at BETWEEN now() + INTERVAL '45 minutes'
                                 AND now() + INTERVAL '75 minutes'
              AND b.start_at - b.created_at >= INTERVAL '1 hour'
              AND b.customer_phone IS NOT NULL
            LIMIT 500
            """).getResultList();
        for (Object[] r : rows) {
            publish(r, "reminder_h1");
            markSent((UUID) r[0], "h1");
        }
        return rows.size();
    }

    private void publish(Object[] r, String templateKind) {
        UUID bookingId   = (UUID) r[0];
        UUID tenantId    = (UUID) r[1];
        UUID branchId    = (UUID) r[2];
        String phone     = (String) r[3];
        String locale    = r[4] == null ? "vi" : (String) r[4];
        Instant startAt  = ((java.sql.Timestamp) r[5]).toInstant();
        String code      = (String) r[6];

        var event = Map.<String, Object>of(
                "bookingId",  bookingId.toString(),
                "tenantId",   tenantId.toString(),
                "branchId",   branchId.toString(),
                "channel",    "sms",
                "to",         phone,
                "locale",     locale,
                "templateKind", templateKind,
                "vars",       Map.of(
                        "code", code == null ? "" : code,
                        "startAt", startAt.toString(),
                        "minutesAway", String.valueOf(
                                Math.max(0, Duration.between(Instant.now(), startAt).toMinutes()))
                )
        );
        kafka.send(topic, bookingId.toString(), event);
    }

    private void markSent(UUID bookingId, String kind) {
        em.createNativeQuery("""
            INSERT INTO booking.reminder_log (booking_id, kind)
            VALUES (:id, :kind)
            ON CONFLICT (booking_id, kind) DO NOTHING
            """)
            .setParameter("id", bookingId)
            .setParameter("kind", kind)
            .executeUpdate();
    }
}
