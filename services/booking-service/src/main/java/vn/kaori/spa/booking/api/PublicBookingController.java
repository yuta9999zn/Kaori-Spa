package vn.kaori.spa.booking.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.booking.domain.Booking;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Public booking endpoints used by the customer-facing site.
 *
 * Why a separate controller from BookingController:
 *   - No auth required.
 *   - Customer doesn't know bed/room/staff IDs — we resolve them.
 *   - Body is intentionally narrow: phone, name, service, requested time.
 *   - Internally calls AvailabilityController.search() to pick a slot, then
 *     BookingService.create().
 */
@RestController
@RequestMapping("/v1/public/bookings")
@RequiredArgsConstructor
public class PublicBookingController {

    private final AvailabilityController availability;
    private final BookingService bookingService;

    public record PublicCreateReq(
            @NotNull UUID tenantId,
            @NotNull UUID branchId,
            @NotBlank String customerName,
            @NotBlank String customerPhone,
            String customerEmail,
            String locale,
            String note,
            @NotBlank String serviceCode,
            int durationMin,
            BigDecimal price,
            @NotNull Instant requestedStart
    ) {}

    public record PublicCreateRes(String code, String status, Instant startAt, Instant endAt) {}

    /**
     * Customer self-service cancel. Phone acts as a soft auth check — if it
     * doesn't match the booking row we refuse, so the URL alone (with the
     * booking code) cannot be used to cancel someone else's slot.
     */
    public record PublicCancelReq(@jakarta.validation.constraints.NotBlank String code,
                                  @jakarta.validation.constraints.NotBlank String phone,
                                  String reason) {}

    @PostMapping("/cancel")
    public ApiResponse<PublicCreateRes> cancelSelf(@Valid @RequestBody PublicCancelReq req) {
        var b = bookingService.cancelByCustomer(req.code(), req.phone(), req.reason());
        return ApiResponse.ok(new PublicCreateRes(b.getCode(), b.getStatus().name(),
                b.getStartAt(), b.getEndAt()));
    }

    public record PublicRescheduleReq(@jakarta.validation.constraints.NotBlank String code,
                                      @jakarta.validation.constraints.NotBlank String phone,
                                      @NotNull Instant newStart) {}

    @PostMapping("/reschedule")
    public ApiResponse<PublicCreateRes> rescheduleSelf(@Valid @RequestBody PublicRescheduleReq req) {
        var b = bookingService.rescheduleByCustomer(req.code(), req.phone(), req.newStart());
        return ApiResponse.ok(new PublicCreateRes(b.getCode(), b.getStatus().name(),
                b.getStartAt(), b.getEndAt()));
    }

    @PostMapping
    public ApiResponse<PublicCreateRes> create(
            @Valid @RequestBody PublicCreateReq req,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        // Search for a matching slot in a 5-min tolerance window.
        Instant from = req.requestedStart().minus(Duration.ofMinutes(5));
        Instant to   = req.requestedStart().plus(Duration.ofMinutes(60));
        var slots = availability.search(
                req.tenantId(), req.branchId(),
                req.serviceCode(), req.durationMin(),
                from, to, 30, 30
        ).data();

        if (slots == null || slots.isEmpty()) {
            throw new AppException(ErrorCodes.BOOKING_SLOT_TAKEN, HttpStatus.CONFLICT,
                    "No bed available at the requested time");
        }
        // Pick the slot closest to the requested time.
        var slot = slots.stream()
                .min((a, b) -> Long.compare(
                        Math.abs(Duration.between(req.requestedStart(), a.startAt()).toMinutes()),
                        Math.abs(Duration.between(req.requestedStart(), b.startAt()).toMinutes())))
                .orElseThrow();

        var cmd = new BookingService.CreateBookingCmd(
                req.tenantId(),
                req.branchId(),
                null,                                // customerId resolved by customer-service later
                req.customerName(),
                req.customerPhone(),
                req.customerEmail(),
                req.locale() == null ? "vi" : req.locale(),
                Booking.Source.web,
                req.note(),
                idempotencyKey,
                null,
                List.of(new BookingService.ItemCmd(
                        req.serviceCode(),
                        Map.of("vi", req.serviceCode()),
                        slot.bedId(), slot.roomId(), slot.staffId(),
                        slot.startAt(), slot.endAt(),
                        req.price() == null ? BigDecimal.ZERO : req.price()
                ))
        );
        var b = bookingService.create(cmd);
        return ApiResponse.ok(new PublicCreateRes(
                b.getCode(), b.getStatus().name(), b.getStartAt(), b.getEndAt()
        ));
    }
}
