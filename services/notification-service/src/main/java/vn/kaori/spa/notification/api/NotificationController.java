package vn.kaori.spa.notification.api;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.notification.domain.Notification;
import vn.kaori.spa.notification.domain.NotificationRepository;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;
import vn.kaori.spa.shared.security.TenantContext;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository repo;

    public record NotificationDto(UUID id, String kind, String title, String body,
                                  Map<String, Object> payload, String severity,
                                  String deepLink, Instant createdAt, boolean unread) {}

    public record InboxRes(List<NotificationDto> items, long total, long unread) {}

    @GetMapping
    public ApiResponse<InboxRes> list(@RequestParam(defaultValue = "false") boolean unreadOnly,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        UUID userId = currentUser();
        var pageRes = repo.listForUser(userId, unreadOnly, PageRequest.of(page, Math.min(size, 50)));
        long unread = repo.countByUserIdAndReadAtIsNullAndArchivedAtIsNull(userId);
        return ApiResponse.ok(new InboxRes(
                pageRes.getContent().stream().map(this::toDto).toList(),
                pageRes.getTotalElements(),
                unread
        ));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<Void> markRead(@PathVariable UUID id) {
        UUID userId = currentUser();
        Notification n = repo.findById(id)
                .filter(x -> userId.equals(x.getUserId()))
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Not found"));
        if (n.getReadAt() == null) {
            n.setReadAt(Instant.now());
            repo.save(n);
        }
        return ApiResponse.ok(null);
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> markAllRead() {
        UUID userId = currentUser();
        // Mark in batch via JPQL would be better; this is the simplest correct version.
        repo.listForUser(userId, true, PageRequest.of(0, 200)).forEach(n -> {
            n.setReadAt(Instant.now());
            repo.save(n);
        });
        return ApiResponse.ok(null);
    }

    private UUID currentUser() {
        TenantContext.Principal p = TenantContext.get();
        if (p == null || p.userId() == null) {
            throw new AppException(ErrorCodes.AUTH_TOKEN_INVALID, HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        return p.userId();
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(n.getId(), n.getKind(), n.getTitle(), n.getBody(),
                n.getPayload(), n.getSeverity(), n.getDeepLink(),
                n.getCreatedAt(), n.isUnread());
    }
}
