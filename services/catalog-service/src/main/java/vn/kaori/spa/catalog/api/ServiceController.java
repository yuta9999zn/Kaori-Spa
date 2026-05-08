package vn.kaori.spa.catalog.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.catalog.domain.Service;
import vn.kaori.spa.catalog.domain.ServiceRepository;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceRepository repo;

    public record ServiceDto(UUID id, String code, Map<String, String> name,
                             String gender, String region, int durationMin,
                             BigDecimal basePrice, boolean combo, int sessions,
                             boolean usesWax, boolean usesMachine, boolean active) {}

    @GetMapping
    public ApiResponse<List<ServiceDto>> search(
            @RequestParam UUID orgId,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) Boolean combo
    ) {
        return ApiResponse.ok(repo.search(orgId, gender, region, combo)
                .stream().map(this::toDto).toList());
    }

    @GetMapping("/{code}")
    public ApiResponse<ServiceDto> get(@RequestParam UUID orgId, @PathVariable String code) {
        Service s = repo.findByOrgIdAndCode(orgId, code)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Service not found"));
        return ApiResponse.ok(toDto(s));
    }

    @PutMapping("/{id}/price")
    @PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER')")
    public ApiResponse<ServiceDto> setPrice(@PathVariable UUID id, @RequestBody Map<String, BigDecimal> body) {
        Service s = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Service not found"));
        s.setBasePrice(body.get("price"));
        return ApiResponse.ok(toDto(repo.save(s)));
    }

    private ServiceDto toDto(Service s) {
        return new ServiceDto(s.getId(), s.getCode(), s.getName(), s.getGender(), s.getRegion(),
                s.getDurationMin(), s.getBasePrice(), s.isCombo(), s.getSessions(),
                s.isUsesWax(), s.isUsesMachine(), s.isActive());
    }
}
