package vn.kaori.spa.booking.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.booking.domain.Booking;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    public record ItemDto(
            @NotBlank String serviceCode,
            Map<String, String> serviceName,
            @NotNull UUID bedId,
            @NotNull UUID roomId,
            UUID staffId,
            @NotNull Instant startAt,
            @NotNull Instant endAt,
            BigDecimal price
    ) {}

    public record CreateBookingRequest(
            @NotNull UUID tenantId,
            @NotNull UUID branchId,
            UUID customerId,
            @NotBlank String customerName,
            @NotBlank String customerPhone,
            String customerEmail,
            String locale,
            String source,
            String note,
            @NotEmpty List<ItemDto> items
    ) {}

    public record BookingDto(
            UUID id,
            String code,
            String status,
            String customerName,
            String customerPhone,
            Instant startAt,
            Instant endAt,
            BigDecimal totalAmount
    ) {}

    @PostMapping
    @Audited(action = "booking.create", entityType = "booking", entityIdExpression = "#req.customerPhone")
    public ApiResponse<BookingDto> create(
            @Valid @RequestBody CreateBookingRequest req,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        var cmd = new BookingService.CreateBookingCmd(
                req.tenantId(),
                req.branchId(),
                req.customerId(),
                req.customerName(),
                req.customerPhone(),
                req.customerEmail(),
                req.locale(),
                req.source() == null ? Booking.Source.web : Booking.Source.valueOf(req.source()),
                req.note(),
                idempotencyKey,
                null,
                req.items().stream().map(i -> new BookingService.ItemCmd(
                        i.serviceCode(), i.serviceName(),
                        i.bedId(), i.roomId(), i.staffId(),
                        i.startAt(), i.endAt(), i.price()
                )).toList()
        );
        var b = bookingService.create(cmd);
        return ApiResponse.ok(toDto(b));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "booking.cancel", entityType = "booking", entityIdExpression = "#id")
    public ApiResponse<BookingDto> cancel(@PathVariable UUID id, @RequestBody(required = false) Map<String, String> body) {
        String reason = body == null ? null : body.get("reason");
        var b = bookingService.cancel(id, null, reason);
        return ApiResponse.ok(toDto(b));
    }

    @PostMapping("/{id}/done")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','THERAPIST')")
    @Audited(action = "booking.done", entityType = "booking", entityIdExpression = "#id")
    public ApiResponse<BookingDto> markDone(@PathVariable UUID id) {
        var b = bookingService.markDone(id);
        return ApiResponse.ok(toDto(b));
    }

    public record DetailDto(UUID id, String code, String status, String source,
                            String customerName, String customerPhone, String customerEmail,
                            Instant startAt, Instant endAt, BigDecimal totalAmount,
                            String note, List<ItemDetail> items) {}

    public record ItemDetail(UUID id, String serviceCode, Map<String, String> serviceName,
                             UUID bedId, UUID roomId, UUID staffId,
                             Instant startAt, Instant endAt, int durationMin, BigDecimal price,
                             String status) {}

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','THERAPIST','ORG_OWNER','TENANT_OWNER','ACCOUNTANT')")
    public ApiResponse<DetailDto> get(@PathVariable UUID id) {
        return ApiResponse.ok(bookingService.getDetail(id));
    }

    public record StatusEntry(String fromStatus, String toStatus, String note, Instant ts) {}

    @GetMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','THERAPIST','ORG_OWNER','TENANT_OWNER','ACCOUNTANT')")
    public ApiResponse<List<StatusEntry>> timeline(@PathVariable UUID id) {
        return ApiResponse.ok(bookingService.timeline(id));
    }

    public record RescheduleReq(@NotNull UUID itemId,
                                @NotNull Instant startAt,
                                @NotNull Instant endAt,
                                UUID bedId,
                                UUID roomId,
                                UUID staffId) {}

    @PostMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST')")
    @Audited(action = "booking.reschedule", entityType = "booking", entityIdExpression = "#id")
    public ApiResponse<DetailDto> reschedule(@PathVariable UUID id,
                                             @Valid @RequestBody RescheduleReq req) {
        return ApiResponse.ok(bookingService.reschedule(id, req.itemId(), req.startAt(), req.endAt(),
                req.bedId(), req.roomId(), req.staffId()));
    }

    private BookingDto toDto(Booking b) {
        return new BookingDto(
                b.getId(), b.getCode(), b.getStatus().name(),
                b.getCustomerName(), b.getCustomerPhone(),
                b.getStartAt(), b.getEndAt(), b.getTotalAmount()
        );
    }
}
