package vn.kaori.spa.booking.reminder;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import vn.kaori.spa.booking.AbstractBookingIT;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Verifies the lead-time guards in ReminderScheduler so the user feedback
 * "khách đặt lịch ngay lập tức" is honoured: a booking made <2h before its
 * start_at must NOT receive a 24h or 1h reminder, and the confirmation
 * message it does receive must be the *_imminent variant.
 */
class ReminderSchedulerIT extends AbstractBookingIT {

    @Autowired ReminderScheduler scheduler;

    @PersistenceContext EntityManager em;

    @SuppressWarnings({"unchecked", "rawtypes"})
    private final KafkaTemplate<String, Object> kafkaMock = mock(KafkaTemplate.class);

    @BeforeEach
    void wireMockKafka() {
        ReflectionTestUtils.setField(scheduler, "kafka", kafkaMock);
        ReflectionTestUtils.setField(scheduler, "topic", "notification.send.v1");
        ReflectionTestUtils.setField(scheduler, "enabled", true);
        clearInvocations(kafkaMock);
        em.createNativeQuery("DELETE FROM booking.reminder_log").executeUpdate();
        em.createNativeQuery("DELETE FROM booking.bookings").executeUpdate();
    }

    @Test
    void last_minute_booking_30min_ahead_only_gets_imminent_confirmation() {
        // start_at = now + 30 min, created_at = now → lead = 30 min
        UUID id = insertBooking(30, 0);

        scheduler.tick();

        // Confirmation must fire with the _imminent template
        verify(kafkaMock, times(1)).send(eq("notification.send.v1"),
                eq(id.toString()),
                argThat(matchesTemplateKind("confirmation_imminent")));

        // No h24 — start_at - created_at < 24h, query excludes it
        verify(kafkaMock, never()).send(anyString(), anyString(),
                argThat(matchesTemplateKind("reminder_h24")));

        // No h1 — start_at < now + 45min, query window starts at +45min
        verify(kafkaMock, never()).send(anyString(), anyString(),
                argThat(matchesTemplateKind("reminder_h1")));

        assertThat(reminderLogKinds(id)).containsExactly("confirmation");
    }

    @Test
    void short_lead_90min_gets_h1_but_not_h24() {
        // start_at = now + 90 min, created_at = now → lead = 90 min
        UUID id = insertBooking(90, 0);

        scheduler.tick();

        // 60 min lead-time guard met for h1, start_at falls in [now+45, now+75] -> just out
        // Actually 90 min is OUTSIDE the h1 window (now+45..now+75) so h1 should NOT fire yet
        verify(kafkaMock, never()).send(anyString(), anyString(),
                argThat(matchesTemplateKind("reminder_h1")));
        // No h24 either — lead < 24h
        verify(kafkaMock, never()).send(anyString(), anyString(),
                argThat(matchesTemplateKind("reminder_h24")));
        // confirmation_imminent only because lead < 2h
        verify(kafkaMock, times(1)).send(anyString(), anyString(),
                argThat(matchesTemplateKind("confirmation_imminent")));
    }

    @Test
    void booking_in_60min_with_60min_lead_fires_h1() {
        // start_at = now + 60 min, created_at = now → lead = 60 min
        UUID id = insertBooking(60, 0);

        scheduler.tick();

        verify(kafkaMock, times(1)).send(anyString(), eq(id.toString()),
                argThat(matchesTemplateKind("reminder_h1")));
        // confirmation_imminent because lead is exactly 1h, < 2h
        verify(kafkaMock, times(1)).send(anyString(), eq(id.toString()),
                argThat(matchesTemplateKind("confirmation_imminent")));
        verify(kafkaMock, never()).send(anyString(), anyString(),
                argThat(matchesTemplateKind("reminder_h24")));

        assertThat(reminderLogKinds(id)).containsExactlyInAnyOrder("confirmation", "h1");
    }

    @Test
    void booking_24h_ahead_with_full_lead_fires_h24() {
        // start_at = now + 24h, created_at = now → lead = 24h, both windows match
        UUID id = insertBooking(24 * 60, 0);

        scheduler.tick();

        verify(kafkaMock, times(1)).send(anyString(), eq(id.toString()),
                argThat(matchesTemplateKind("reminder_h24")));
        // Regular confirmation (lead >= 2h)
        verify(kafkaMock, times(1)).send(anyString(), eq(id.toString()),
                argThat(matchesTemplateKind("confirmation")));
        verify(kafkaMock, never()).send(anyString(), anyString(),
                argThat(matchesTemplateKind("reminder_h1")));
    }

    @Test
    void booking_24h_ahead_but_created_recently_skips_h24() {
        // start_at = now + 24h, created_at = now - 30 min → lead = 23.5h
        // The h24 guard `start_at - created_at >= 24h` excludes this booking.
        UUID id = insertBooking(24 * 60, -30);

        scheduler.tick();

        verify(kafkaMock, never()).send(anyString(), anyString(),
                argThat(matchesTemplateKind("reminder_h24")));
        // confirmation already deduped because we created the booking 30 min ago,
        // so it's still in the 1h confirmation window — and lead >= 2h → regular.
        verify(kafkaMock, times(1)).send(anyString(), eq(id.toString()),
                argThat(matchesTemplateKind("confirmation")));
    }

    @Test
    void second_tick_does_not_resend_same_reminder() {
        UUID id = insertBooking(60, 0);
        scheduler.tick();
        clearInvocations(kafkaMock);

        // Second tick with the same booking state must hit reminder_log dedup.
        scheduler.tick();

        verifyNoInteractions(kafkaMock);
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private UUID insertBooking(int startInMinutes, int createdOffsetMinutes) {
        UUID id = UUID.randomUUID();
        em.createNativeQuery("""
            INSERT INTO booking.bookings
              (id, tenant_id, branch_id, code, status, customer_phone, customer_locale,
               start_at, created_at)
            VALUES
              (:id, :tid, :bid, :code, 'confirmed', '0900000000', 'vi',
               now() + (:start || ' minutes')::interval,
               now() + (:created || ' minutes')::interval)
            """)
            .setParameter("id", id)
            .setParameter("tid", UUID.randomUUID())
            .setParameter("bid", UUID.randomUUID())
            .setParameter("code", "TST-" + id.toString().substring(0, 4))
            .setParameter("start", startInMinutes)
            .setParameter("created", createdOffsetMinutes)
            .executeUpdate();
        return id;
    }

    @SuppressWarnings("unchecked")
    private List<String> reminderLogKinds(UUID bookingId) {
        return em.createNativeQuery(
                "SELECT kind FROM booking.reminder_log WHERE booking_id = :id ORDER BY kind")
            .setParameter("id", bookingId)
            .getResultList();
    }

    private static org.mockito.ArgumentMatcher<Object> matchesTemplateKind(String expected) {
        return event -> event instanceof Map<?, ?> m
                && expected.equals(String.valueOf(m.get("templateKind")));
    }
}
