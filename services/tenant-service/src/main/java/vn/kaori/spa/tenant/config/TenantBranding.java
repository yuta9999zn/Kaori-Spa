package vn.kaori.spa.tenant.config;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Per-tenant visual branding: logos, colors, fonts, and i18n marketing copy.
 * Localized text (login_welcome, booking_tagline, email_footer) uses the
 * standard {locale -> text} JSONB map pattern (see Role#name).
 */
@Entity
@Table(name = "tenant_branding", schema = "tenant")
@Getter
@Setter
@NoArgsConstructor
public class TenantBranding {

    @Id
    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "favicon_url", columnDefinition = "TEXT")
    private String faviconUrl;

    @Column(name = "primary_color", nullable = false, length = 16)
    private String primaryColor = "#C9A87C";

    @Column(name = "secondary_color", nullable = false, length = 16)
    private String secondaryColor = "#D9B8B5";

    @Column(name = "accent_color", nullable = false, length = 16)
    private String accentColor = "#DCD6DD";

    @Column(name = "background_color", nullable = false, length = 16)
    private String backgroundColor = "#F4EFEA";

    @Column(name = "heading_font", nullable = false, length = 64)
    private String headingFont = "Playfair Display";

    @Column(name = "body_font", nullable = false, length = 64)
    private String bodyFont = "Inter";

    @Type(JsonType.class)
    @Column(name = "login_welcome", columnDefinition = "jsonb")
    private Map<String, String> loginWelcome = new HashMap<>();

    @Type(JsonType.class)
    @Column(name = "booking_tagline", columnDefinition = "jsonb")
    private Map<String, String> bookingTagline = new HashMap<>();

    @Column(name = "email_logo_url", columnDefinition = "TEXT")
    private String emailLogoUrl;

    @Column(name = "email_header_bg", length = 16)
    private String emailHeaderBg;

    @Type(JsonType.class)
    @Column(name = "email_footer", columnDefinition = "jsonb")
    private Map<String, String> emailFooter = new HashMap<>();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
