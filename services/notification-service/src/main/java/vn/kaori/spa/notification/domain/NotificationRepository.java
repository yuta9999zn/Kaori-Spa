package vn.kaori.spa.notification.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("""
        SELECT n FROM Notification n WHERE n.userId = :userId
          AND n.archivedAt IS NULL
          AND (:unreadOnly = false OR n.readAt IS NULL)
        ORDER BY n.createdAt DESC
        """)
    Page<Notification> listForUser(@Param("userId") UUID userId,
                                   @Param("unreadOnly") boolean unreadOnly,
                                   Pageable pageable);

    long countByUserIdAndReadAtIsNullAndArchivedAtIsNull(UUID userId);
}
