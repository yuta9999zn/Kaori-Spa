package vn.kaori.spa.tenant.onboarding;

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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Surface for the tenant-admin onboarding wizard. The wizard is a five-step
 * sequence:
 * <pre>welcome -> org -> branch -> team -> done</pre>
 *
 * <p>Authorization: TENANT_OWNER for self-service, SUPER_ADMIN may operate
 * cross-tenant. Cross-tenant access for non-super callers is rejected with
 * {@code TENANT_MISMATCH}, mirroring the
 * {@link vn.kaori.spa.tenant.config.TenantConfigController} pattern.
 */
@RestController
@RequestMapping("/v1/tenants/{tenantId}/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final TenantOnboardingRepository repo;

    // ── DTOs ────────────────────────────────────────────────────────────
    public record OnboardingStateDto(
            UUID tenantId,
            String currentStep,
            List<String> completedSteps,
            Instant startedAt,
            Instant completedAt,
            Map<String, Object> metadata
    ) {}

    public record AdvanceRequest(
            @NotBlank String step,
            Map<String, Object> metadata
    ) {}

    // ── Endpoints ───────────────────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    public ApiResponse<OnboardingStateDto> get(@PathVariable UUID tenantId) {
        requireSameTenantOrSuper(tenantId);
        // Lazily initialize: a tenant that has never visited the wizard gets
        // a fresh "welcome" row on first read.
        TenantOnboarding o = repo.findById(tenantId).orElseGet(() -> {
            TenantOnboarding fresh = new TenantOnboarding();
            fresh.setTenantId(tenantId);
            return repo.save(fresh);
        });
        return ApiResponse.ok(toDto(o));
    }

    @PostMapping("/advance")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    @Audited(action = "tenant.onboarding.advance",
             entityType = "tenant_onboarding",
             entityIdExpression = "#tenantId")
    public ApiResponse<OnboardingStateDto> advance(@PathVariable UUID tenantId,
                                                   @Valid @RequestBody AdvanceRequest req) {
        requireSameTenantOrSuper(tenantId);
        TenantOnboarding o = repo.findById(tenantId).orElseGet(() -> {
            TenantOnboarding fresh = new TenantOnboarding();
            fresh.setTenantId(tenantId);
            return fresh;
        });
        // Append the previous step (the one we're moving away from) to the
        // completed list so the FE can render checkmarks. We dedup to keep
        // the list idempotent if /advance is hit twice for the same step.
        String previous = o.getCurrentStep();
        List<String> done = o.getCompletedSteps() == null
                ? new ArrayList<>() : new ArrayList<>(o.getCompletedSteps());
        if (previous != null && !done.contains(previous)) {
            done.add(previous);
        }
        o.setCompletedSteps(done);
        o.setCurrentStep(req.step());
        if (req.metadata() != null) {
            // Shallow merge: caller-supplied keys overwrite, others persist.
            Map<String, Object> merged = o.getMetadata() == null
                    ? new HashMap<>() : new HashMap<>(o.getMetadata());
            merged.putAll(req.metadata());
            o.setMetadata(merged);
        }
        return ApiResponse.ok(toDto(repo.save(o)));
    }

    @PostMapping("/complete")
    @PreAuthorize("hasAnyRole('TENANT_OWNER','SUPER_ADMIN')")
    @Audited(action = "tenant.onboarding.complete",
             entityType = "tenant_onboarding",
             entityIdExpression = "#tenantId")
    public ApiResponse<OnboardingStateDto> complete(@PathVariable UUID tenantId) {
        requireSameTenantOrSuper(tenantId);
        TenantOnboarding o = repo.findById(tenantId).orElseGet(() -> {
            TenantOnboarding fresh = new TenantOnboarding();
            fresh.setTenantId(tenantId);
            return fresh;
        });
        List<String> done = o.getCompletedSteps() == null
                ? new ArrayList<>() : new ArrayList<>(o.getCompletedSteps());
        // Mark every canonical step as done so the FE doesn't have to know the
        // sequence to render the checklist.
        for (String s : List.of("welcome", "org", "branch", "team", "done")) {
            if (!done.contains(s)) done.add(s);
        }
        o.setCompletedSteps(done);
        o.setCurrentStep("done");
        o.setCompletedAt(Instant.now());
        return ApiResponse.ok(toDto(repo.save(o)));
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

    private OnboardingStateDto toDto(TenantOnboarding o) {
        return new OnboardingStateDto(
                o.getTenantId(),
                o.getCurrentStep(),
                o.getCompletedSteps() == null ? List.of() : List.copyOf(o.getCompletedSteps()),
                o.getStartedAt(),
                o.getCompletedAt(),
                o.getMetadata() == null ? Map.of() : Map.copyOf(o.getMetadata())
        );
    }
}
