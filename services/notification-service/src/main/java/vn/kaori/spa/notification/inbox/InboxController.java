package vn.kaori.spa.notification.inbox;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;
import vn.kaori.spa.shared.security.TenantContext;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Per-user inbox notification center.
 *
 * <p>All endpoints are scoped to the caller's user id (taken from the JWT
 * principal via {@link TenantContext}). Authentication is required, but no
 * role check is enforced — every signed-in user has an inbox.</p>
 *
 * <p>Reads ({@code GET}) are not audited; the two write endpoints
 * ({@code mark-read}, {@code mark-all-read}) emit a {@code @Audited} event
 * to {@code kaori.audit.event.v1}.</p>
 */
@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class InboxController {

    private static final int MAX_PAGE_SIZE = 100;

    private final InboxNotificationRepository repo;

    public record NotificationDto(
            UUID id,
            String type,
            InboxNotification.Severity severity,
            String title,
            String body,
            String link,
            Instant readAt,
            Instant createdAt
    ) {}

    public record PagedNotifications(
            List<NotificationDto> items,
            long total,
            int page,
            int size
    ) {}

    public record UnreadCount(long count) {}

    @GetMapping
    public ApiResponse<PagedNotifications> list(
            @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID userId = currentUserId();
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        var pageable = PageRequest.of(safePage, safeSize);

        Page<InboxNotification> result = unreadOnly
                ? repo.findAllByUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId, pageable)
                : repo.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);

        var items = result.getContent().stream().map(this::toDto).toList();
        return ApiResponse.ok(new PagedNotifications(
                items, result.getTotalElements(), safePage, safeSize
        ));
    }

    @GetMapping("/unread-count")
    public ApiResponse<UnreadCount> unreadCount() {
        UUID userId = currentUserId();
        return ApiResponse.ok(new UnreadCount(repo.countByUserIdAndReadAtIsNull(userId)));
    }

    @PostMapping("/{id}/mark-read")
    @Audited(action = "notification.mark-read", entityType = "notification", entityIdExpression = "#id")
    @Transactional
    public ApiResponse<Void> markRead(@PathVariable UUID id) {
        UUID userId = currentUserId();
        // Validate the row exists and belongs to caller; 404 if not (covers
        // both missing and cross-user IDs without leaking existence).
        var notif = repo.findById(id)
                .filter(n -> userId.equals(n.getUserId()))
                .orElseThrow(() -> new AppException(
                        ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Notification not found"));
        if (notif.getReadAt() == null) {
            repo.markRead(id, userId, Instant.now());
        }
        return ApiResponse.ok(null);
    }

    @PostMapping("/mark-all-read")
    @Audited(action = "notification.mark-all-read", entityType = "notification")
    @Transactional
    public ApiResponse<Void> markAllRead() {
        UUID userId = currentUserId();
        repo.markAllRead(userId, Instant.now());
        return ApiResponse.ok(null);
    }

    private UUID currentUserId() {
        TenantContext.Principal p = TenantContext.get();
        if (p == null || p.userId() == null) {
            throw new AppException(
                    ErrorCodes.AUTH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED,
                    "Authentication required");
        }
        return p.userId();
    }

    private NotificationDto toDto(InboxNotification n) {
        return new NotificationDto(
                n.getId(),
                n.getType(),
                n.getSeverity(),
                n.getTitle(),
                n.getBody(),
                n.getLink(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}
