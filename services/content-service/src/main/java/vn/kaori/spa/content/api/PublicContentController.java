package vn.kaori.spa.content.api;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.content.domain.ContentPost;
import vn.kaori.spa.content.domain.ContentPostRepository;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Public, unauthenticated content endpoints used by client-web. Returns only
 * published posts. View count is incremented on single-post fetch.
 */
@RestController
@RequestMapping("/v1/public/content")
@RequiredArgsConstructor
public class PublicContentController {

    private final ContentPostRepository repo;
    private final ContentService contentService;
    private final OrgResolver orgResolver;

    public record PublicPostDto(
            UUID id,
            String type,
            String slug,
            Map<String, String> title,
            Map<String, String> excerpt,
            Map<String, String> body,
            Instant publishedAt,
            int viewCount,
            String coverUrl,
            List<String> tags
    ) {}

    public record PublicPostListItem(
            UUID id,
            String type,
            String slug,
            Map<String, String> title,
            Map<String, String> excerpt,
            Instant publishedAt,
            String coverUrl,
            List<String> tags
    ) {}

    public record PagedResult<T>(List<T> items, long total, int page, int size) {}

    @GetMapping("/{tenantSlug}/{orgSlug}")
    public ApiResponse<PagedResult<PublicPostListItem>> list(
            @PathVariable String tenantSlug,
            @PathVariable String orgSlug,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID orgId = orgResolver.resolveOrgId(tenantSlug, orgSlug);
        ContentPost.PostType typeEnum = parseType(type);
        int safeSize = Math.min(Math.max(size, 1), 100);
        int safePage = Math.max(page, 0);
        var pageable = PageRequest.of(safePage, safeSize,
                Sort.by(Sort.Direction.DESC, "publishedAt"));
        var pageRes = repo.findPublishedByOrg(orgId, typeEnum, pageable);
        var items = pageRes.getContent().stream().map(this::toListItem).toList();
        return ApiResponse.ok(new PagedResult<>(items, pageRes.getTotalElements(),
                pageRes.getNumber(), pageRes.getSize()));
    }

    @GetMapping("/{tenantSlug}/{orgSlug}/{slug}")
    public ApiResponse<PublicPostDto> get(
            @PathVariable String tenantSlug,
            @PathVariable String orgSlug,
            @PathVariable String slug
    ) {
        UUID orgId = orgResolver.resolveOrgId(tenantSlug, orgSlug);
        var post = repo.findPublishedByOrgAndSlug(orgId, slug)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Content post not found: " + slug));
        // Increment view count on each public read. Eventual-consistency is fine
        // — concurrent reads may double-count by a small amount; a Kafka-event
        // approach can replace this when we wire analytics-service.
        contentService.incrementViewCount(post);
        return ApiResponse.ok(toDto(post));
    }

    private ContentPost.PostType parseType(String t) {
        if (t == null || t.isBlank()) return null;
        try {
            return ContentPost.PostType.valueOf(t);
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Unknown content type: " + t);
        }
    }

    private PublicPostDto toDto(ContentPost p) {
        return new PublicPostDto(p.getId(), p.getType().name(), p.getSlug(),
                p.getTitle(), p.getExcerpt(), p.getBody(),
                p.getPublishedAt(), p.getViewCount(),
                p.getCoverUrl(), p.getTags());
    }

    private PublicPostListItem toListItem(ContentPost p) {
        return new PublicPostListItem(p.getId(), p.getType().name(), p.getSlug(),
                p.getTitle(), p.getExcerpt(),
                p.getPublishedAt(), p.getCoverUrl(), p.getTags());
    }
}
