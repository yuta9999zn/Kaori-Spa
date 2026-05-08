package vn.kaori.spa.content.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.content.domain.ContentPost;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;
import vn.kaori.spa.shared.security.TenantContext;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Authenticated CMS endpoints. Backs /content pages in tenant-admin,
 * org-admin and branch-admin portals.
 */
@RestController
@RequestMapping("/v1/content")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;

    public record PostDto(
            UUID id,
            UUID orgId,
            UUID branchId,
            String type,
            String slug,
            Map<String, String> title,
            Map<String, String> excerpt,
            Map<String, String> body,
            String status,
            Instant publishedAt,
            Instant scheduledAt,
            UUID authorId,
            int viewCount,
            Integer seoScore,
            String coverUrl,
            List<String> tags,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record PostListItem(
            UUID id,
            UUID branchId,
            String type,
            String slug,
            Map<String, String> title,
            String status,
            Instant publishedAt,
            int viewCount,
            String coverUrl,
            List<String> tags,
            Instant updatedAt
    ) {}

    public record PagedResult<T>(List<T> items, long total, int page, int size) {}

    public record CreatePostReq(
            @NotNull UUID orgId,
            UUID branchId,
            @NotBlank String type,
            @NotBlank String slug,
            @NotNull Map<String, String> title,
            Map<String, String> excerpt,
            Map<String, String> body,
            String coverUrl,
            List<String> tags,
            Instant scheduledAt
    ) {}

    public record UpdatePostReq(
            String type,
            String slug,
            Map<String, String> title,
            Map<String, String> excerpt,
            Map<String, String> body,
            String status,
            String coverUrl,
            List<String> tags,
            Instant scheduledAt,
            Integer seoScore
    ) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('ORG_OWNER','BRANCH_MANAGER','TENANT_OWNER')")
    public ApiResponse<PagedResult<PostListItem>> list(
            @RequestParam UUID orgId,
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID tenantId = TenantContext.requireTenantId();
        var typeEnum = parseType(type);
        var statusEnum = parseStatus(status);
        var pageRes = contentService.search(tenantId, orgId, branchId, typeEnum, statusEnum, q, page, size);
        var items = pageRes.getContent().stream().map(this::toListItem).toList();
        return ApiResponse.ok(new PagedResult<>(items, pageRes.getTotalElements(),
                pageRes.getNumber(), pageRes.getSize()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORG_OWNER','BRANCH_MANAGER','TENANT_OWNER')")
    @Audited(action = "content.create", entityType = "content_post", entityIdExpression = "#req.slug")
    public ApiResponse<PostDto> create(@Valid @RequestBody CreatePostReq req) {
        UUID tenantId = TenantContext.requireTenantId();
        var principal = TenantContext.get();
        UUID authorId = principal == null ? null : principal.userId();
        var cmd = new ContentService.CreateCmd(
                tenantId,
                req.orgId(),
                req.branchId(),
                parseType(req.type()),
                req.slug(),
                req.title(),
                req.excerpt(),
                req.body(),
                authorId,
                req.coverUrl(),
                req.tags(),
                req.scheduledAt()
        );
        return ApiResponse.ok(toDto(contentService.create(cmd)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORG_OWNER','BRANCH_MANAGER','TENANT_OWNER')")
    public ApiResponse<PostDto> get(@PathVariable UUID id) {
        UUID tenantId = TenantContext.requireTenantId();
        return ApiResponse.ok(toDto(contentService.get(tenantId, id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORG_OWNER','BRANCH_MANAGER','TENANT_OWNER')")
    @Audited(action = "content.update", entityType = "content_post", entityIdExpression = "#id")
    public ApiResponse<PostDto> update(@PathVariable UUID id, @Valid @RequestBody UpdatePostReq req) {
        UUID tenantId = TenantContext.requireTenantId();
        var cmd = new ContentService.UpdateCmd(
                parseType(req.type()),
                req.slug(),
                req.title(),
                req.excerpt(),
                req.body(),
                parseStatus(req.status()),
                req.coverUrl(),
                req.tags(),
                req.scheduledAt(),
                req.seoScore()
        );
        return ApiResponse.ok(toDto(contentService.update(tenantId, id, cmd)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "content.delete", entityType = "content_post", entityIdExpression = "#id")
    public ApiResponse<Void> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.requireTenantId();
        contentService.delete(tenantId, id);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ORG_OWNER','BRANCH_MANAGER','TENANT_OWNER')")
    @Audited(action = "content.publish", entityType = "content_post", entityIdExpression = "#id")
    public ApiResponse<PostDto> publish(@PathVariable UUID id) {
        UUID tenantId = TenantContext.requireTenantId();
        return ApiResponse.ok(toDto(contentService.publish(tenantId, id)));
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

    private ContentPost.Status parseStatus(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return ContentPost.Status.valueOf(s);
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Unknown content status: " + s);
        }
    }

    private PostDto toDto(ContentPost p) {
        return new PostDto(p.getId(), p.getOrgId(), p.getBranchId(),
                p.getType().name(), p.getSlug(),
                p.getTitle(), p.getExcerpt(), p.getBody(),
                p.getStatus().name(), p.getPublishedAt(), p.getScheduledAt(),
                p.getAuthorId(), p.getViewCount(), p.getSeoScore(),
                p.getCoverUrl(), p.getTags(),
                p.getCreatedAt(), p.getUpdatedAt());
    }

    private PostListItem toListItem(ContentPost p) {
        return new PostListItem(p.getId(), p.getBranchId(),
                p.getType().name(), p.getSlug(), p.getTitle(),
                p.getStatus().name(), p.getPublishedAt(),
                p.getViewCount(), p.getCoverUrl(), p.getTags(),
                p.getUpdatedAt());
    }
}
