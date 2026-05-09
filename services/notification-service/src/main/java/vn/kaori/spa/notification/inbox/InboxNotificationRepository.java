package vn.kaori.spa.notification.inbox;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface InboxNotificationRepository extends JpaRepository<InboxNotification, UUID> {

    Page<InboxNotification> findAllByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<InboxNotification> findAllByUserIdAndReadAtIsNullOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserIdAndReadAtIsNull(UUID userId);

    @Modifying
    @Query("UPDATE InboxNotification n SET n.readAt = :ts " +
           "WHERE n.id = :id AND n.userId = :userId AND n.readAt IS NULL")
    int markRead(@Param("id") UUID id, @Param("userId") UUID userId, @Param("ts") Instant ts);

    @Modifying
    @Query("UPDATE InboxNotification n SET n.readAt = :ts " +
           "WHERE n.userId = :userId AND n.readAt IS NULL")
    int markAllRead(@Param("userId") UUID userId, @Param("ts") Instant ts);
}
