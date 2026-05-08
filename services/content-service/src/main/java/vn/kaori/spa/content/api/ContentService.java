package vn.kaori.spa.content.api;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.kaori.spa.content.domain.ContentPost;
import vn.kaori.spa.content.domain.ContentPostRepository;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * CRUD service for content posts. All methods require an explicit
 * {@code tenantId} (passed from controllers via TenantContext) so we never
 * leak data across tenants.
 */
@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentPostRepository repo;

    public record CreateCmd(
            UUID tenantId,
            UUID orgId,
            UUID branchId,
            ContentPost.PostType type,
            String slug,
            Map<String, String> title,
            Map<String, String> excerpt,
            Map<String, String> body,
            UUID authorId,
            String coverUrl,
            List<String> tags,
            Instant scheduledAt
    ) {}

    public record UpdateCmd(
            ContentPost.PostType type,
            String slug,
            Map<String, String> title,
            Map<String, String> excerpt,
            Map<String, String> body,
            ContentPost.Status status,
            String coverUrl,
            List<String> tags,
            Instant scheduledAt,
            Integer seoScore
    ) {}

    @Transactional
    public ContentPost create(CreateCmd cmd) {
        repo.findByTenantIdAndOrgIdAndSlug(cmd.tenantId(), cmd.orgId(), cmd.slug())
                .ifPresent(existing -> {
                    throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                            "Slug already exists for this org: " + cmd.slug());
                });
        var p = new ContentPost();
        p.setTenantId(cmd.tenantId());
        p.setOrgId(cmd.orgId());
        p.setBranchId(cmd.branchId());
        p.setType(cmd.type() == null ? ContentPost.PostType.article : cmd.type());
        p.setSlug(cmd.slug());
        if (cmd.title() != null) p.setTitle(cmd.title());
        p.setExcerpt(cmd.excerpt());
        p.setBody(cmd.body());
        p.setAuthorId(cmd.authorId());
        p.setCoverUrl(cmd.coverUrl());
        if (cmd.tags() != null) p.setTags(cmd.tags());
        p.setScheduledAt(cmd.scheduledAt());
        p.setStatus(cmd.scheduledAt() != null
                ? ContentPost.Status.scheduled
                : ContentPost.Status.draft);
        return repo.save(p);
    }

    @Transactional(readOnly = true)
    public ContentPost get(UUID tenantId, UUID id) {
        var p = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Content post not found: " + id));
        if (!p.getTenantId().equals(tenantId)) {
            // Don't leak existence across tenants.
            throw new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND,
                    "Content post not found: " + id);
        }
        return p;
    }

    @Transactional
    public ContentPost update(UUID tenantId, UUID id, UpdateCmd cmd) {
        var p = get(tenantId, id);
        if (cmd.slug() != null && !cmd.slug().equals(p.getSlug())) {
            repo.findByTenantIdAndOrgIdAndSlug(tenantId, p.getOrgId(), cmd.slug())
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                                "Slug already exists for this org: " + cmd.slug());
                    });
            p.setSlug(cmd.slug());
        }
        if (cmd.type() != null) p.setType(cmd.type());
        if (cmd.title() != null) p.setTitle(cmd.title());
        if (cmd.excerpt() != null) p.setExcerpt(cmd.excerpt());
        if (cmd.body() != null) p.setBody(cmd.body());
        if (cmd.status() != null) p.setStatus(cmd.status());
        if (cmd.coverUrl() != null) p.setCoverUrl(cmd.coverUrl());
        if (cmd.tags() != null) p.setTags(cmd.tags());
        if (cmd.scheduledAt() != null) p.setScheduledAt(cmd.scheduledAt());
        if (cmd.seoScore() != null) p.setSeoScore(cmd.seoScore());
        p.setUpdatedAt(Instant.now());
        return repo.save(p);
    }

    @Transactional
    public void delete(UUID tenantId, UUID id) {
        var p = get(tenantId, id);
        repo.delete(p);
    }

    @Transactional
    public ContentPost publish(UUID tenantId, UUID id) {
        var p = get(tenantId, id);
        p.setStatus(ContentPost.Status.published);
        p.setPublishedAt(Instant.now());
        p.setUpdatedAt(Instant.now());
        return repo.save(p);
    }

    @Transactional(readOnly = true)
    public Page<ContentPost> search(
            UUID tenantId,
            UUID orgId,
            UUID branchId,
            ContentPost.PostType type,
            ContentPost.Status status,
            String q,
            int page,
            int size
    ) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        int safePage = Math.max(page, 0);
        var pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "updatedAt"));
        String qNorm = (q == null || q.isBlank()) ? null : q.trim();
        return repo.searchPaged(tenantId, orgId, branchId, type, status, qNorm, pageable);
    }

    @Transactional
    public ContentPost incrementViewCount(ContentPost p) {
        p.setViewCount(p.getViewCount() + 1);
        return repo.save(p);
    }
}
