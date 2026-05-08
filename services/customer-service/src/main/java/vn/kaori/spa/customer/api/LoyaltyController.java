package vn.kaori.spa.customer.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.customer.domain.Customer;
import vn.kaori.spa.customer.domain.CustomerRepository;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Loyalty earn / redeem endpoints.
 *
 *   POST /v1/loyalty/earn   { customerId, spendAmount, refType, refId }
 *     → applies the customer's current tier earn rule, increments points
 *       and lifetime_spend (which auto-syncs the segment via trigger).
 *
 *   POST /v1/loyalty/redeem { customerId, points }
 *     → checks balance + cap, deducts points, returns the discount in VND
 *       so the booking-service can apply it on the next bill.
 */
@RestController
@RequestMapping("/v1/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final CustomerRepository repo;

    @PersistenceContext
    private EntityManager em;

    public record EarnReq(
            @NotNull UUID customerId,
            @NotNull @Positive BigDecimal spendAmount,
            String refType,
            UUID refId
    ) {}

    public record RedeemReq(
            @NotNull UUID customerId,
            @NotNull @Positive Integer points,
            BigDecimal billAmount  // optional, used to enforce % cap
    ) {}

    public record EarnRes(int newPoints, int balance, String segment, BigDecimal lifetimeSpend) {}
    public record RedeemRes(int balance, BigDecimal discountAmount) {}
    public record TierDto(String code, Map<String, Object> name, BigDecimal threshold,
                          BigDecimal earnPerVnd, BigDecimal redeemPerPt, BigDecimal redeemCapPct) {}

    @PostMapping("/earn")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','ACCOUNTANT')")
    @Audited(action = "loyalty.earn", entityType = "loyalty", entityIdExpression = "#req.customerId")
    @Transactional
    public ApiResponse<EarnRes> earn(@Valid @RequestBody EarnReq req) {
        Customer c = repo.findById(req.customerId())
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Customer not found"));

        BigDecimal earnRate = currentEarnRate(c);
        int delta = req.spendAmount().multiply(earnRate)
                .setScale(0, RoundingMode.FLOOR).intValue();

        c.setPoints(c.getPoints() + delta);
        c.setLifetimeSpend(c.getLifetimeSpend().add(req.spendAmount()));
        repo.save(c);

        em.createNativeQuery("""
            INSERT INTO customer.loyalty_transactions (customer_id, delta, reason, ref_type, ref_id)
            VALUES (:cid, :delta, :reason, :refType, :refId)
            """)
            .setParameter("cid", c.getId())
            .setParameter("delta", delta)
            .setParameter("reason", "Earn from spend " + req.spendAmount().toPlainString())
            .setParameter("refType", req.refType())
            .setParameter("refId", req.refId())
            .executeUpdate();

        return ApiResponse.ok(new EarnRes(delta, c.getPoints(), c.getSegment(), c.getLifetimeSpend()));
    }

    @PostMapping("/redeem")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','ACCOUNTANT')")
    @Audited(action = "loyalty.redeem", entityType = "loyalty", entityIdExpression = "#req.customerId")
    @Transactional
    public ApiResponse<RedeemRes> redeem(@Valid @RequestBody RedeemReq req) {
        Customer c = repo.findById(req.customerId())
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Customer not found"));

        if (c.getPoints() < req.points()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "Insufficient points: " + c.getPoints() + " < " + req.points());
        }

        TierConfig tier = currentTier(c);
        BigDecimal discount = BigDecimal.valueOf(req.points()).multiply(tier.redeemPerPt());

        if (req.billAmount() != null) {
            BigDecimal cap = req.billAmount().multiply(tier.redeemCapPct()).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            if (discount.compareTo(cap) > 0) {
                throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                        "Discount exceeds " + tier.redeemCapPct() + "% of bill");
            }
        }

        c.setPoints(c.getPoints() - req.points());
        repo.save(c);

        em.createNativeQuery("""
            INSERT INTO customer.loyalty_transactions (customer_id, delta, reason)
            VALUES (:cid, :delta, :reason)
            """)
            .setParameter("cid", c.getId())
            .setParameter("delta", -req.points())
            .setParameter("reason", "Redeem " + req.points() + " pts → " + discount.toPlainString() + " VND")
            .executeUpdate();

        return ApiResponse.ok(new RedeemRes(c.getPoints(), discount));
    }

    public record LedgerRow(int delta, String reason, java.time.Instant ts, String refType, UUID refId) {}

    @GetMapping("/customers/{customerId}/ledger")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<LedgerRow>> ledger(@PathVariable UUID customerId) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT delta, reason, created_at, ref_type, ref_id
            FROM customer.loyalty_transactions
            WHERE customer_id = :cid
            ORDER BY created_at DESC
            LIMIT 50
            """)
            .setParameter("cid", customerId)
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new LedgerRow(
                ((Number) r[0]).intValue(),
                (String) r[1],
                ((java.sql.Timestamp) r[2]).toInstant(),
                (String) r[3],
                (UUID) r[4]
        )).toList());
    }

    @GetMapping("/tiers")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<TierDto>> tiers(@RequestParam UUID tenantId) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT code, name, threshold, earn_per_vnd, redeem_per_pt, redeem_cap_pct
            FROM customer.loyalty_tiers
            WHERE tenant_id = :tid
            ORDER BY sort_order
            """)
            .setParameter("tid", tenantId)
            .getResultList();
        return ApiResponse.ok(rows.stream().map(r -> new TierDto(
                (String) r[0],
                Map.of("raw", r[1]),
                (BigDecimal) r[2],
                (BigDecimal) r[3],
                (BigDecimal) r[4],
                (BigDecimal) r[5]
        )).toList());
    }

    private record TierConfig(BigDecimal earnPerVnd, BigDecimal redeemPerPt, BigDecimal redeemCapPct) {}

    @SuppressWarnings("unchecked")
    private TierConfig currentTier(Customer c) {
        var rows = (List<Object[]>) em.createNativeQuery("""
            SELECT earn_per_vnd, redeem_per_pt, redeem_cap_pct
            FROM customer.loyalty_tiers
            WHERE tenant_id = :tid AND code = :seg
            LIMIT 1
            """)
            .setParameter("tid", c.getTenantId())
            .setParameter("seg", c.getSegment())
            .getResultList();
        if (rows.isEmpty()) {
            return new TierConfig(new BigDecimal("0.0001"), new BigDecimal("1000"), new BigDecimal("10"));
        }
        Object[] r = rows.get(0);
        return new TierConfig((BigDecimal) r[0], (BigDecimal) r[1], (BigDecimal) r[2]);
    }

    private BigDecimal currentEarnRate(Customer c) {
        return currentTier(c).earnPerVnd();
    }
}
