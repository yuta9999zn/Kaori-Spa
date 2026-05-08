package vn.kaori.spa.content.domain;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Content post: article, promotion, event, announcement, SEO page.
 * Org-level when {@code branchId} is null; branch-specific otherwise.
 */
@Entity
@Table(name = "content_post", schema = "content")
@Getter @Setter @NoArgsConstructor
public class ContentPost {

    public enum PostType { article, promotion, event, announcement, seo }
    public enum Status { draft, published, scheduled, archived }

    @Id @GeneratedValue private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "org_id", nullable = false, updatable = false) private UUID orgId;
    @Column(name = "branch_id") private UUID branchId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostType type = PostType.article;

    @Column(nullable = false, length = 160) private String slug;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> title = new HashMap<>();

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> excerpt;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.draft;

    @Column(name = "published_at") private Instant publishedAt;
    @Column(name = "scheduled_at") private Instant scheduledAt;
    @Column(name = "author_id") private UUID authorId;

    @Column(name = "view_count", nullable = false) private int viewCount = 0;
    @Column(name = "seo_score") private Integer seoScore;
    @Column(name = "cover_url") private String coverUrl;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<String> tags = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();
}
