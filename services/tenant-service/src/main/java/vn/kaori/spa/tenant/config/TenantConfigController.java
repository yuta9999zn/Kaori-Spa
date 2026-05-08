package vn.kaori.spa.tenant.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
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
 * Tenant-level platform configuration: domain, branding, feature flags.
 *
 * Authorization rules:
 *   - All endpoints require TENANT_OWNER (or platform-wide SUPER_ADMIN).
 *   - Path tenantId must match the caller's TenantContext, unless the caller
 *     is SUPER_ADMIN — that role may operate cross-tenant.
 */
@RestController
@RequestMapping("/v1/tenants/{tenantId}")
@RequiredArgsConstructor
public class TenantConfigController {

    private final TenantDomainConfigRepository domainRepo;
    private final TenantBrandingRepository brandingRepo;
    private final TenantFeatureFlagRepository featureRepo;

    // ── DTOs ────────────────────────────────────────────────────────────
    public record DomainConfigDto(
            UUID tenantId,
            String subdomain,
            String customDomain,
            String sslStatus,
            Instant sslExpiresAt,
            boolean forceHttps,
            boolean redirectOldUrl,
            boolean requireLogin,
            Instant updatedAt
    ) {}

    public record DomainConfigRequest(
            @NotBlank String subdomain,
            String customDomain,
            String sslStatus,
            Instant sslExpiresAt,
            Boolean forceHttps,
            Boolean redirectOldUrl,
            Boolean requireLogin
    ) {}

    public record BrandingDto(
            UUID tenantId,
            String logoUrl,
            String faviconUrl,
            String primaryColor,
            String secondaryColor,
            String accentColor,
            String backgroundColor,
            String headingFont,
            String bodyFont,
            Map<String, String> loginWelcome,
            Map<String, String> bookingTagline,
            String emailLogoUrl,
            String emailHeaderBg,
            Map<String, String> emailFooter,
            Instant updatedAt
    ) {}

    public record BrandingRequest(
            String logoUrl,
            String faviconUrl,
            String primaryColor,
            String secondaryColor,
            String accentColor,
            String backgroundColor,
            String headingFont,
            String bodyFont,
            Map<String, String> loginWelcome,
            Map<String, String> bookingTagline,
            String emailLogoUrl,
            String emailHeaderBg,
            Map<String, String> emailFooter
    ) {}

    public record FeatureFlagDto(
            UUID tenantId,
            String moduleKey,
            boolean enabled,
            boolean premium,
            boolean configured,
            Instant activatedAt
    ) {}

    public record FeatureFlagRequest(
            Boolean enabled,
            Boolean premium,
            Boolean configured
    ) {}

    // ── Domain ──────────────────────────────────────────────────────────
    @GetMapping("/domain")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    public ApiResponse<DomainConfigDto> getDomain(@PathVariable UUID tenantId) {
        requireSameTenantOrSuper(tenantId);
        TenantDomainConfig d = domainRepo.findById(tenantId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Domain config not found"));
        return ApiResponse.ok(toDomainDto(d));
    }

    @PutMapping("/domain")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    @Audited(action = "tenant.domain.update", entityType = "tenant_domain_config", entityIdExpression = "#tenantId")
    public ApiResponse<DomainConfigDto> upsertDomain(@PathVariable UUID tenantId,
                                                     @Valid @RequestBody DomainConfigRequest req) {
        requireSameTenantOrSuper(tenantId);
        // Reject collisions with another tenant's subdomain / custom_domain.
        domainRepo.findBySubdomain(req.subdomain()).ifPresent(other -> {
            if (!other.getTenantId().equals(tenantId)) {
                throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Subdomain already in use");
            }
        });
        if (req.customDomain() != null && !req.customDomain().isBlank()) {
            domainRepo.findByCustomDomain(req.customDomain()).ifPresent(other -> {
                if (!other.getTenantId().equals(tenantId)) {
                    throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Custom domain already in use");
                }
            });
        }
        TenantDomainConfig d = domainRepo.findById(tenantId).orElseGet(() -> {
            TenantDomainConfig fresh = new TenantDomainConfig();
            fresh.setTenantId(tenantId);
            return fresh;
        });
        d.setSubdomain(req.subdomain());
        d.setCustomDomain(req.customDomain());
        if (req.sslStatus() != null) {
            if (!List.of("pending", "active", "failed").contains(req.sslStatus())) {
                throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, "Invalid ssl_status");
            }
            d.setSslStatus(req.sslStatus());
        }
        if (req.sslExpiresAt() != null) d.setSslExpiresAt(req.sslExpiresAt());
        if (req.forceHttps() != null) d.setForceHttps(req.forceHttps());
        if (req.redirectOldUrl() != null) d.setRedirectOldUrl(req.redirectOldUrl());
        if (req.requireLogin() != null) d.setRequireLogin(req.requireLogin());
        d.setUpdatedAt(Instant.now());
        return ApiResponse.ok(toDomainDto(domainRepo.save(d)));
    }

    // ── Branding ────────────────────────────────────────────────────────
    @GetMapping("/branding")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    public ApiResponse<BrandingDto> getBranding(@PathVariable UUID tenantId) {
        requireSameTenantOrSuper(tenantId);
        TenantBranding b = brandingRepo.findById(tenantId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Branding not found"));
        return ApiResponse.ok(toBrandingDto(b));
    }

    @PutMapping("/branding")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    @Audited(action = "tenant.branding.update", entityType = "tenant_branding", entityIdExpression = "#tenantId")
    public ApiResponse<BrandingDto> upsertBranding(@PathVariable UUID tenantId,
                                                   @Valid @RequestBody BrandingRequest req) {
        requireSameTenantOrSuper(tenantId);
        TenantBranding b = brandingRepo.findById(tenantId).orElseGet(() -> {
            TenantBranding fresh = new TenantBranding();
            fresh.setTenantId(tenantId);
            return fresh;
        });
        if (req.logoUrl() != null)         b.setLogoUrl(req.logoUrl());
        if (req.faviconUrl() != null)      b.setFaviconUrl(req.faviconUrl());
        if (req.primaryColor() != null)    b.setPrimaryColor(req.primaryColor());
        if (req.secondaryColor() != null)  b.setSecondaryColor(req.secondaryColor());
        if (req.accentColor() != null)     b.setAccentColor(req.accentColor());
        if (req.backgroundColor() != null) b.setBackgroundColor(req.backgroundColor());
        if (req.headingFont() != null)     b.setHeadingFont(req.headingFont());
        if (req.bodyFont() != null)        b.setBodyFont(req.bodyFont());
        if (req.loginWelcome() != null)    b.setLoginWelcome(req.loginWelcome());
        if (req.bookingTagline() != null)  b.setBookingTagline(req.bookingTagline());
        if (req.emailLogoUrl() != null)    b.setEmailLogoUrl(req.emailLogoUrl());
        if (req.emailHeaderBg() != null)   b.setEmailHeaderBg(req.emailHeaderBg());
        if (req.emailFooter() != null)     b.setEmailFooter(req.emailFooter());
        b.setUpdatedAt(Instant.now());
        return ApiResponse.ok(toBrandingDto(brandingRepo.save(b)));
    }

    // ── Feature flags ───────────────────────────────────────────────────
    @GetMapping("/features")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    public ApiResponse<List<FeatureFlagDto>> listFeatures(@PathVariable UUID tenantId) {
        requireSameTenantOrSuper(tenantId);
        List<FeatureFlagDto> items = featureRepo.findAllByTenantId(tenantId).stream()
                .map(this::toFeatureDto).toList();
        return ApiResponse.ok(items);
    }

    @PutMapping("/features/{moduleKey}")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    @Audited(action = "tenant.feature.update", entityType = "tenant_feature_flag", entityIdExpression = "#moduleKey")
    public ApiResponse<FeatureFlagDto> upsertFeature(@PathVariable UUID tenantId,
                                                     @PathVariable String moduleKey,
                                                     @RequestBody FeatureFlagRequest req) {
        requireSameTenantOrSuper(tenantId);
        TenantFeatureFlag f = featureRepo.findByTenantIdAndModuleKey(tenantId, moduleKey)
                .orElseGet(() -> {
                    TenantFeatureFlag fresh = new TenantFeatureFlag();
                    fresh.setTenantId(tenantId);
                    fresh.setModuleKey(moduleKey);
                    return fresh;
                });
        if (req.enabled() != null) {
            // First-enable transition stamps activated_at for trial / billing.
            if (req.enabled() && !f.isEnabled() && f.getActivatedAt() == null) {
                f.setActivatedAt(Instant.now());
            }
            f.setEnabled(req.enabled());
        }
        if (req.premium() != null)    f.setPremium(req.premium());
        if (req.configured() != null) f.setConfigured(req.configured());
        f.setUpdatedAt(Instant.now());
        return ApiResponse.ok(toFeatureDto(featureRepo.save(f)));
    }

    // ── Helpers ─────────────────────────────────────────────────────────
    private void requireSameTenantOrSuper(UUID pathTenantId) {
        TenantContext.Principal p = TenantContext.get();
        boolean isSuper = p != null && p.roles() != null
                && (p.roles().contains("SUPER_ADMIN") || p.roles().contains("ROLE_SUPER_ADMIN"));
        if (isSuper) return;
        UUID callerTid = TenantContext.requireTenantId();
        if (!callerTid.equals(pathTenantId)) {
            throw new AppException(ErrorCodes.TENANT_MISMATCH, HttpStatus.FORBIDDEN,
                    "Cross-tenant access denied");
        }
    }

    private DomainConfigDto toDomainDto(TenantDomainConfig d) {
        return new DomainConfigDto(
                d.getTenantId(), d.getSubdomain(), d.getCustomDomain(),
                d.getSslStatus(), d.getSslExpiresAt(),
                d.isForceHttps(), d.isRedirectOldUrl(), d.isRequireLogin(),
                d.getUpdatedAt()
        );
    }

    private BrandingDto toBrandingDto(TenantBranding b) {
        return new BrandingDto(
                b.getTenantId(), b.getLogoUrl(), b.getFaviconUrl(),
                b.getPrimaryColor(), b.getSecondaryColor(), b.getAccentColor(), b.getBackgroundColor(),
                b.getHeadingFont(), b.getBodyFont(),
                b.getLoginWelcome(), b.getBookingTagline(),
                b.getEmailLogoUrl(), b.getEmailHeaderBg(), b.getEmailFooter(),
                b.getUpdatedAt()
        );
    }

    private FeatureFlagDto toFeatureDto(TenantFeatureFlag f) {
        return new FeatureFlagDto(
                f.getTenantId(), f.getModuleKey(),
                f.isEnabled(), f.isPremium(), f.isConfigured(), f.getActivatedAt()
        );
    }
}
