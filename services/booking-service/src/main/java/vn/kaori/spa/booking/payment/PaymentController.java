package vn.kaori.spa.booking.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.booking.outbox.BookingOutboxEvent;
import vn.kaori.spa.booking.outbox.BookingOutboxRepository;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final TransactionRepository txRepo;
    private final BookingOutboxRepository outboxRepo;

    public record PayReq(
            @NotNull UUID tenantId,
            @NotNull UUID branchId,
            @NotBlank String txnType,             // dv | mp
            @NotBlank String methodCode,           // tm / the / ck-loc / ck-cty / vi-mom
            @NotNull @DecimalMin("1") BigDecimal amount,
            UUID bookingId,
            String customerName,
            String customerPhone,
            String note
    ) {}

    public record TxDto(UUID id, String type, String method, BigDecimal amount,
                        UUID bookingId, String customerName, String customerPhone,
                        Instant paidAt, String receiptNo) {}

    @PostMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','ACCOUNTANT')")
    @Audited(action = "payment.create", entityType = "transaction",
             entityIdExpression = "#req.bookingId")
    @Transactional
    public ApiResponse<TxDto> pay(@Valid @RequestBody PayReq req) {
        Transaction t = new Transaction();
        t.setTenantId(req.tenantId());
        t.setBranchId(req.branchId());
        try {
            t.setTxnType(Transaction.Type.valueOf(req.txnType()));
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Invalid txnType: " + req.txnType());
        }
        t.setMethodCode(req.methodCode());
        t.setAmount(req.amount());
        t.setBookingId(req.bookingId());
        t.setCustomerName(req.customerName());
        t.setCustomerPhone(req.customerPhone());
        t.setNote(req.note());
        t.setReceiptNo(generateReceipt());
        t = txRepo.save(t);

        outboxRepo.save(new BookingOutboxEvent(
                req.tenantId(),
                "kaori.payment.completed.v1",
                t.getId().toString(),
                String.format("{\"tenantId\":\"%s\",\"branchId\":\"%s\",\"bookingId\":\"%s\",\"amount\":%s,\"customer\":\"%s\"}",
                        req.tenantId(), req.branchId(),
                        req.bookingId() == null ? "" : req.bookingId(),
                        req.amount().toPlainString(),
                        req.customerName() == null ? "" : req.customerName().replace("\"", "\\\""))
        ));
        return ApiResponse.ok(toDto(t));
    }

    @GetMapping("/by-booking/{bookingId}")
    public ApiResponse<List<TxDto>> byBooking(@PathVariable UUID bookingId) {
        return ApiResponse.ok(txRepo.findAllByBookingIdOrderByPaidAtDesc(bookingId)
                .stream().map(this::toDto).toList());
    }

    private TxDto toDto(Transaction t) {
        return new TxDto(t.getId(), t.getTxnType().name(), t.getMethodCode(),
                t.getAmount(), t.getBookingId(), t.getCustomerName(), t.getCustomerPhone(),
                t.getPaidAt(), t.getReceiptNo());
    }

    private String generateReceipt() {
        // Production: per-branch sequence in DB. Quick win: timestamp-based.
        return "RC-" + System.currentTimeMillis();
    }
}
