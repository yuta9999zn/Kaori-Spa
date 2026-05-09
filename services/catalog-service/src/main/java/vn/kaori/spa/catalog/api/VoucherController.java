package vn.kaori.spa.catalog.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Voucher validation + redemption.
 *
 *   GET  /v1/vouchers/lookup?code=...       — preview (no side effect)
 *   POST /v1/vouchers/redeem                — record a redemption + return discount
 */
@RestController
@RequestMapping("/v1/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    @PersistenceContext
    private EntityManager em;

    public record VoucherDto(UUID id, String code, String kind, BigDecimal value,
                             BigDecimal capAmount, BigDecimal minBill,
                             Instant validFrom, Instant validTo, int maxUsesPerCustomer) {}
    public record RedeemReq(@NotNull UUID orgId,
                            @NotBlank String code,
                            @NotBlank String customerPhone,
                            @NotNull @Positive BigDecimal billAmount,
                            UUID bookingId) {}
    public record RedeemRes(BigDecimal discountAmount, BigDecimal billAfter, String code) {}

    public record AdminVoucherDto(UUID id, String code, String kind, BigDecimal value,
                                  BigDecimal capAmount, BigDecimal minBill,
                                  Instant validFrom, Instant validTo,
                                  Integer maxUses, int usedCount,
                                  int maxUsesPerCustomer, boolean active) {}

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','MARKETING')")
    @SuppressWarnings("unchecked")
    // TODO(round-8): paginate. Returns all vouchers for an org — typically <200
    // active vouchers but unbounded over time as expired ones accumulate. Cap
    // at 500 in SQL for now so an old org can't OOM the response.
    public ApiResponse<List<AdminVoucherDto>> list(@RequestParam UUID orgId) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT id, code, kind, value, cap_amount, min_bill, valid_from, valid_to,
                   max_uses, used_count, max_uses_per_customer, is_active
            FROM catalog.vouchers
            WHERE org_id = :org
            ORDER BY created_at DESC
            LIMIT 500
            """)
            .setParameter("org", orgId)
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new AdminVoucherDto(
                (UUID) r[0], (String) r[1], (String) r[2],
                (BigDecimal) r[3], (BigDecimal) r[4], (BigDecimal) r[5],
                ((java.sql.Timestamp) r[6]).toInstant(),
                ((java.sql.Timestamp) r[7]).toInstant(),
                r[8] == null ? null : ((Number) r[8]).intValue(),
                ((Number) r[9]).intValue(),
                ((Number) r[10]).intValue(),
                (Boolean) r[11]
        )).toList());
    }

    public record CreateReq(
            @NotNull UUID tenantId,
            @NotNull UUID orgId,
            @NotBlank String code,
            @NotBlank String kind,        // PERCENT | FIXED
            @NotNull @Positive BigDecimal value,
            BigDecimal capAmount,
            BigDecimal minBill,
            @NotNull Instant validFrom,
            @NotNull Instant validTo,
            Integer maxUses,
            Integer maxUsesPerCustomer
    ) {}

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','MARKETING')")
    @vn.kaori.spa.shared.audit.Audited(action = "voucher.create", entityType = "voucher", entityIdExpression = "#req.code")
    @Transactional
    public ApiResponse<List<AdminVoucherDto>> create(@Valid @RequestBody CreateReq req) {
        if (!"PERCENT".equals(req.kind()) && !"FIXED".equals(req.kind())) {
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "kind must be PERCENT or FIXED");
        }
        UUID id = UUID.randomUUID();
        em.createNativeQuery("""
            INSERT INTO catalog.vouchers (id, tenant_id, org_id, code, kind, value, cap_amount,
                                           min_bill, valid_from, valid_to, max_uses,
                                           max_uses_per_customer, is_active)
            VALUES (:id, :tid, :org, upper(:code), :kind, :value, :cap, :min,
                    :vf, :vt, :maxU, :maxC, TRUE)
            """)
            .setParameter("id", id)
            .setParameter("tid", req.tenantId())
            .setParameter("org", req.orgId())
            .setParameter("code", req.code().trim())
            .setParameter("kind", req.kind())
            .setParameter("value", req.value())
            .setParameter("cap", req.capAmount())
            .setParameter("min", req.minBill() == null ? BigDecimal.ZERO : req.minBill())
            .setParameter("vf", req.validFrom())
            .setParameter("vt", req.validTo())
            .setParameter("maxU", req.maxUses())
            .setParameter("maxC", req.maxUsesPerCustomer() == null ? 1 : req.maxUsesPerCustomer())
            .executeUpdate();

        return list(req.orgId());  // return refreshed list — simpler than fetch-by-id
    }

    @PostMapping("/{id}/toggle")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ORG_OWNER','TENANT_OWNER','MARKETING')")
    @vn.kaori.spa.shared.audit.Audited(action = "voucher.toggle", entityType = "voucher", entityIdExpression = "#id")
    @Transactional
    public ApiResponse<Void> toggle(@PathVariable UUID id) {
        em.createNativeQuery("UPDATE catalog.vouchers SET is_active = NOT is_active WHERE id = :id")
            .setParameter("id", id)
            .executeUpdate();
        return ApiResponse.ok(null);
    }

    @GetMapping("/lookup")
    @SuppressWarnings("unchecked")
    public ApiResponse<VoucherDto> lookup(@RequestParam UUID orgId, @RequestParam String code) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT id, code, kind, value, cap_amount, min_bill, valid_from, valid_to, max_uses_per_customer
            FROM catalog.vouchers
            WHERE org_id = :org AND upper(code) = upper(:code) AND is_active = TRUE
            LIMIT 1
            """)
            .setParameter("org", orgId)
            .setParameter("code", code)
            .getResultList();
        if (rows.isEmpty()) {
            throw new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Voucher not found");
        }
        Object[] r = rows.get(0);
        return ApiResponse.ok(new VoucherDto(
                (UUID) r[0], (String) r[1], (String) r[2],
                (BigDecimal) r[3], (BigDecimal) r[4], (BigDecimal) r[5],
                ((java.sql.Timestamp) r[6]).toInstant(),
                ((java.sql.Timestamp) r[7]).toInstant(),
                ((Number) r[8]).intValue()
        ));
    }

    @PostMapping("/redeem")
    @Audited(action = "voucher.redeem", entityType = "voucher", entityIdExpression = "#req.code")
    @Transactional
    public ApiResponse<RedeemRes> redeem(@Valid @RequestBody RedeemReq req) {
        var v = lookup(req.orgId(), req.code()).data();
        if (v == null) {
            throw new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Voucher not found");
        }

        Instant now = Instant.now();
        if (now.isBefore(v.validFrom()) || now.isAfter(v.validTo())) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Voucher expired or not yet active");
        }
        if (req.billAmount().compareTo(v.minBill()) < 0) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "Bill " + req.billAmount() + " below minimum " + v.minBill());
        }

        // Per-customer cap.
        Long usedByCustomer = ((Number) em.createNativeQuery("""
            SELECT COUNT(*) FROM catalog.voucher_redemptions
            WHERE voucher_id = :vid AND customer_phone = :phone
            """)
            .setParameter("vid", v.id())
            .setParameter("phone", req.customerPhone())
            .getSingleResult()).longValue();
        if (usedByCustomer >= v.maxUsesPerCustomer()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "You have already used this voucher the maximum number of times");
        }

        BigDecimal discount;
        if ("PERCENT".equals(v.kind())) {
            discount = req.billAmount().multiply(v.value()).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            if (v.capAmount() != null && discount.compareTo(v.capAmount()) > 0) {
                discount = v.capAmount();
            }
        } else {
            discount = v.value();
            if (discount.compareTo(req.billAmount()) > 0) discount = req.billAmount();
        }

        em.createNativeQuery("""
            UPDATE catalog.vouchers SET used_count = used_count + 1
            WHERE id = :vid
              AND (max_uses IS NULL OR used_count < max_uses)
            """)
            .setParameter("vid", v.id())
            .executeUpdate();

        em.createNativeQuery("""
            INSERT INTO catalog.voucher_redemptions (voucher_id, booking_id, customer_phone, discount_amount, bill_amount)
            VALUES (:vid, :bid, :phone, :disc, :bill)
            """)
            .setParameter("vid", v.id())
            .setParameter("bid", req.bookingId())
            .setParameter("phone", req.customerPhone())
            .setParameter("disc", discount)
            .setParameter("bill", req.billAmount())
            .executeUpdate();

        return ApiResponse.ok(new RedeemRes(
                discount,
                req.billAmount().subtract(discount),
                v.code()
        ));
    }
}
