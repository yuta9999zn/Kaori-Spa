package vn.kaori.spa.booking.api;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.shared.api.ApiResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Customer-centric history view used by the branch-admin detail page.
 * Mirrors the customer's "Quản lý lượt KH SD DV" Excel sheet — visits per
 * date with the body region(s) treated.
 *
 * Two queries:
 *   1. Booking history (one row per booking).
 *   2. Region usage matrix (count of completed visits per region).
 */
@RestController
@RequestMapping("/v1/customers/{customerPhone}")
@RequiredArgsConstructor
public class CustomerHistoryController {

    @PersistenceContext
    private EntityManager em;

    public record VisitDto(String bookingCode, Instant startAt, String status,
                           List<ItemDto> items, BigDecimal total) {}

    public record ItemDto(String serviceCode, Map<String, String> serviceName,
                          String region, BigDecimal price, String staffName) {}

    public record RegionUsage(String region, long visits, Instant lastVisit) {}

    @GetMapping("/visits")
    @SuppressWarnings("unchecked")
    public ApiResponse<List<VisitDto>> visits(@PathVariable String customerPhone,
                                              @RequestParam UUID branchId) {
        List<Object[]> bookings = em.createNativeQuery("""
            SELECT b.id, b.code, b.start_at, b.status, b.total_amount
            FROM booking.bookings b
            WHERE b.branch_id = :branchId
              AND b.customer_phone = :phone
            ORDER BY b.start_at DESC
            LIMIT 200
            """)
            .setParameter("branchId", branchId)
            .setParameter("phone", customerPhone)
            .getResultList();

        List<VisitDto> out = new java.util.ArrayList<>();
        for (Object o : bookings) {
            Object[] row = (Object[]) o;
            UUID bookingId = (UUID) row[0];

            List<Object[]> items = em.createNativeQuery("""
                SELECT i.service_code, i.service_name::text,
                       (SELECT s.region FROM catalog.services s WHERE s.code = i.service_code LIMIT 1) AS region,
                       i.price,
                       st.full_name
                FROM booking.booking_items i
                LEFT JOIN booking.staff st ON st.id = i.staff_id
                WHERE i.booking_id = :bid
                """)
                .setParameter("bid", bookingId)
                .getResultList();

            List<ItemDto> itemDtos = items.stream().map(ix -> {
                Object[] ir = (Object[]) ix;
                return new ItemDto(
                        (String) ir[0],
                        parseJsonMap((String) ir[1]),
                        ir[2] == null ? "unknown" : (String) ir[2],
                        (BigDecimal) ir[3],
                        ir[4] == null ? null : (String) ir[4]
                );
            }).toList();

            out.add(new VisitDto(
                    (String) row[1],
                    ((java.sql.Timestamp) row[2]).toInstant(),
                    (String) row[3],
                    itemDtos,
                    (BigDecimal) row[4]
            ));
        }
        return ApiResponse.ok(out);
    }

    @GetMapping("/regions")
    public ApiResponse<List<RegionUsage>> regions(@PathVariable String customerPhone,
                                                  @RequestParam UUID branchId) {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT s.region,
                   COUNT(*) AS visits,
                   MAX(i.start_at) AS last_visit
            FROM booking.booking_items i
            JOIN booking.bookings b ON b.id = i.booking_id
            JOIN catalog.services s ON s.code = i.service_code
            WHERE b.branch_id = :branchId
              AND b.customer_phone = :phone
              AND i.status IN ('done', 'in_progress')
            GROUP BY s.region
            ORDER BY visits DESC
            """)
            .setParameter("branchId", branchId)
            .setParameter("phone", customerPhone)
            .getResultList();

        return ApiResponse.ok(rows.stream().map(r -> {
            Object[] x = (Object[]) r;
            return new RegionUsage(
                    (String) x[0],
                    ((Number) x[1]).longValue(),
                    x[2] == null ? null : ((java.sql.Timestamp) x[2]).toInstant()
            );
        }).toList());
    }

    private Map<String, String> parseJsonMap(String json) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(json, new com.fasterxml.jackson.core.type.TypeReference<Map<String, String>>() {});
        } catch (Exception ex) {
            return Map.of("vi", json == null ? "" : json);
        }
    }
}
