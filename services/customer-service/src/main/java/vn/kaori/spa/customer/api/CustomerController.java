package vn.kaori.spa.customer.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.customer.domain.Customer;
import vn.kaori.spa.customer.domain.CustomerRepository;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerRepository repo;

    @PersistenceContext
    private EntityManager em;

    public record CustomerDto(UUID id, String code, String fullName, String nickname,
                              String phone, String email, String gender, LocalDate dob,
                              String locale, String nationality, String segment,
                              int points, String notes) {}

    public record CreateReq(
            @NotNull UUID tenantId,
            @NotNull UUID orgId,
            @NotBlank String fullName,
            String nickname,
            @NotBlank String phone,
            String email, String gender, LocalDate dob,
            String locale, String nationality, String segment, String notes
    ) {}

    public record SearchResult(List<CustomerDto> items, long total, int page, int size) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','THERAPIST','ORG_OWNER','TENANT_OWNER','ACCOUNTANT')")
    public ApiResponse<SearchResult> search(@RequestParam UUID orgId,
                                            @RequestParam(defaultValue = "") String q,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        var pageRes = repo.search(orgId, q, PageRequest.of(page, Math.min(size, 100)));
        return ApiResponse.ok(new SearchResult(
                pageRes.getContent().stream().map(this::toDto).toList(),
                pageRes.getTotalElements(), page, size
        ));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "customer.create", entityType = "customer", entityIdExpression = "#req.phone")
    public ApiResponse<CustomerDto> create(@Valid @RequestBody CreateReq req) {
        var existing = repo.findByOrgIdAndPhoneAndDeletedAtIsNull(req.orgId(), req.phone());
        if (existing.isPresent()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "Customer with this phone already exists");
        }
        Customer c = new Customer();
        c.setTenantId(req.tenantId());
        c.setOrgId(req.orgId());
        String nationality = req.nationality() == null ? "VN" : req.nationality();
        short year  = (short) java.time.Year.now().getValue();
        short month = (short) java.time.LocalDate.now().getMonthValue();
        // Generate code via DB function: YY+D+M+nationalityIdx+seq3 (e.g. 24D11001).
        String code = (String) em.createNativeQuery(
                "SELECT customer.next_customer_code(:org, :year, :month, :nat)"
        )
        .setParameter("org", req.orgId())
        .setParameter("year", year)
        .setParameter("month", month)
        .setParameter("nat", nationality)
        .getSingleResult();
        c.setCode(code);
        c.setNationality(nationality);
        c.setFirstVisitMonth(month);
        c.setFullName(req.fullName());
        c.setNickname(req.nickname());
        c.setPhone(req.phone());
        c.setEmail(req.email());
        c.setGender(req.gender());
        c.setDob(req.dob());
        if (req.locale() != null) c.setLocale(req.locale());
        if (req.segment() != null) c.setSegment(req.segment());
        c.setNotes(req.notes());
        return ApiResponse.ok(toDto(repo.save(c)));
    }

    @GetMapping("/{id}")
    public ApiResponse<CustomerDto> get(@PathVariable UUID id) {
        Customer c = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Customer not found"));
        return ApiResponse.ok(toDto(c));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "customer.update", entityType = "customer", entityIdExpression = "#id")
    public ApiResponse<CustomerDto> update(@PathVariable UUID id, @RequestBody CreateReq req) {
        Customer c = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Customer not found"));
        if (req.fullName() != null) c.setFullName(req.fullName());
        if (req.email() != null) c.setEmail(req.email());
        if (req.gender() != null) c.setGender(req.gender());
        if (req.dob() != null) c.setDob(req.dob());
        if (req.notes() != null) c.setNotes(req.notes());
        if (req.segment() != null) c.setSegment(req.segment());
        return ApiResponse.ok(toDto(repo.save(c)));
    }

    private CustomerDto toDto(Customer c) {
        return new CustomerDto(c.getId(), c.getCode(), c.getFullName(), c.getNickname(),
                c.getPhone(), c.getEmail(), c.getGender(), c.getDob(),
                c.getLocale(), c.getNationality(),
                c.getSegment(), c.getPoints(), c.getNotes());
    }
}
