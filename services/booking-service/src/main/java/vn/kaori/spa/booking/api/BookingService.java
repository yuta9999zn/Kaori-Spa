package vn.kaori.spa.booking.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.kaori.spa.booking.domain.*;
import vn.kaori.spa.booking.domain.Repositories.*;
import vn.kaori.spa.booking.outbox.BookingOutboxEvent;
import vn.kaori.spa.booking.outbox.BookingOutboxRepository;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Core booking workflow.
 *
 * Conflict prevention strategy:
 *   1. App-layer pre-check (friendly error).
 *   2. DB-level EXCLUDE USING gist (truth — wins under contention).
 *
 * Flow for create():
 *   - Resolve idempotency key (return existing booking on replay).
 *   - For each requested item:
 *       * Validate bed exists + active + belongs to branch.
 *       * Validate staff (if any) is active in branch and has the skill.
 *       * Check bed overlap (DB).
 *       * Check staff overlap (DB).
 *   - Persist booking + items in one tx.
 *   - Write outbox event for `kaori.booking.created.v1`.
 *   - On DB integrity violation → translate to BOOKING_SLOT_TAKEN.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepo;
    private final BookingItemRepository itemRepo;
    private final BedRepository bedRepo;
    private final StaffRepository staffRepo;
    private final RoomRepository roomRepo;
    private final StaffSkillRepository skillRepo;
    private final BookingOutboxRepository outboxRepo;
    private final ShiftChecker shiftChecker;
    private final ObjectMapper mapper;

    @Transactional
    public Booking create(CreateBookingCmd cmd) {
        // Idempotency replay
        if (cmd.idempotencyKey() != null) {
            var existing = bookingRepo.findByTenantIdAndIdempotencyKey(cmd.tenantId(), cmd.idempotencyKey());
            if (existing.isPresent()) return existing.get();
        }

        if (cmd.items() == null || cmd.items().isEmpty()) {
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Booking must have at least 1 service item");
        }

        // Compute window from items
        Instant minStart = cmd.items().stream().map(ItemCmd::startAt).min(Instant::compareTo).orElseThrow();
        Instant maxEnd   = cmd.items().stream().map(ItemCmd::endAt).max(Instant::compareTo).orElseThrow();

        // App-layer pre-checks
        for (ItemCmd it : cmd.items()) {
            preCheck(cmd.tenantId(), cmd.branchId(), it);
        }

        Booking b = new Booking();
        b.setTenantId(cmd.tenantId());
        b.setBranchId(cmd.branchId());
        b.setCode(generateCode(cmd.tenantId()));
        b.setCustomerId(cmd.customerId());
        b.setCustomerName(cmd.customerName());
        b.setCustomerPhone(cmd.customerPhone());
        b.setCustomerEmail(cmd.customerEmail());
        b.setLocale(cmd.locale() == null ? "vi" : cmd.locale());
        b.setStatus(Booking.Status.pending);
        b.setSource(cmd.source() == null ? Booking.Source.web : cmd.source());
        b.setStartAt(minStart);
        b.setEndAt(maxEnd);
        b.setNote(cmd.note());
        b.setIdempotencyKey(cmd.idempotencyKey());
        b.setCreatedBy(cmd.createdBy());

        BigDecimal total = BigDecimal.ZERO;
        try {
            b = bookingRepo.save(b);

            for (ItemCmd it : cmd.items()) {
                BookingItem bi = new BookingItem();
                bi.setTenantId(cmd.tenantId());
                bi.setBranchId(cmd.branchId());
                bi.setBookingId(b.getId());
                bi.setServiceCode(it.serviceCode());
                bi.setServiceName(it.serviceName() == null ? Map.of("vi", it.serviceCode()) : it.serviceName());
                bi.setBedId(it.bedId());
                bi.setRoomId(it.roomId());
                bi.setStaffId(it.staffId());
                bi.setStartAt(it.startAt());
                bi.setEndAt(it.endAt());
                bi.setDurationMin((int) ChronoUnit.MINUTES.between(it.startAt(), it.endAt()));
                bi.setPrice(it.price() == null ? BigDecimal.ZERO : it.price());
                bi.setStatus("pending");
                itemRepo.save(bi);
                total = total.add(bi.getPrice());
            }
            b.setTotalAmount(total);
            b = bookingRepo.save(b);

            // Outbox: published by OutboxPublisher in shared-kernel.
            outboxRepo.save(new BookingOutboxEvent(
                    cmd.tenantId(),
                    "kaori.booking.created.v1",
                    b.getId().toString(),
                    serialize(b)
            ));
        } catch (DataIntegrityViolationException ex) {
            // Translate the EXCLUDE constraint violation into a domain error.
            String msg = ex.getMostSpecificCause() == null ? "" : ex.getMostSpecificCause().getMessage();
            if (msg.contains("excl_bed_no_overlap")) {
                throw new AppException(ErrorCodes.BOOKING_SLOT_TAKEN, HttpStatus.CONFLICT,
                        "Bed is already booked for that time");
            }
            if (msg.contains("excl_staff_no_overlap")) {
                throw new AppException(ErrorCodes.BOOKING_STAFF_BUSY, HttpStatus.CONFLICT,
                        "Staff is already booked for that time");
            }
            throw ex;
        }
        return b;
    }

    /**
     * Mark booking as done. The bookings.status sync trigger flips items
     * status='done', which fires {@code trg_item_commission} (V7 migration)
     * to write a {@code staff_commissions} row for each item with staff.
     */
    @Transactional
    public Booking markDone(UUID bookingId) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Booking not found"));
        if (b.getStatus() == Booking.Status.done) return b;
        if (b.getStatus() == Booking.Status.cancelled || b.getStatus() == Booking.Status.no_show) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "Cannot mark booking " + b.getCode() + " as done from status " + b.getStatus());
        }
        b.setStatus(Booking.Status.done);
        b = bookingRepo.save(b);
        outboxRepo.save(new BookingOutboxEvent(
                b.getTenantId(),
                "kaori.booking.completed.v1",
                b.getId().toString(),
                serialize(b)
        ));
        return b;
    }

    /**
     * Customer-side cancel. Phone acts as a soft auth check.
     */
    @Transactional
    public Booking cancelByCustomer(String code, String phone, String reason) {
        Booking b = bookingRepo.findAll().stream()
                .filter(x -> code.equalsIgnoreCase(x.getCode()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Booking not found"));
        if (!phone.replaceAll("\\s", "").equals(b.getCustomerPhone().replaceAll("\\s", ""))) {
            throw new AppException(ErrorCodes.PERM_DENIED, HttpStatus.FORBIDDEN, "Phone does not match booking");
        }
        return cancel(b.getId(), null, reason == null ? "customer-self-service" : reason);
    }

    @Transactional
    public Booking rescheduleByCustomer(String code, String phone, Instant newStart) {
        Booking b = bookingRepo.findAll().stream()
                .filter(x -> code.equalsIgnoreCase(x.getCode()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Booking not found"));
        if (!phone.replaceAll("\\s", "").equals(b.getCustomerPhone().replaceAll("\\s", ""))) {
            throw new AppException(ErrorCodes.PERM_DENIED, HttpStatus.FORBIDDEN, "Phone does not match booking");
        }
        var items = itemRepo.findAllByBookingId(b.getId());
        if (items.size() != 1) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "Self-reschedule supports single-item bookings only — please call us");
        }
        var item = items.get(0);
        Instant newEnd = newStart.plus(java.time.Duration.between(item.getStartAt(), item.getEndAt()));
        reschedule(b.getId(), item.getId(), newStart, newEnd, null, null, null);
        return bookingRepo.findById(b.getId()).orElseThrow();
    }

    /**
     * Tenant- and branch-scoped paged list for the branch-admin booking page.
     * Filters are all optional. The result maps each booking to a compact
     * {@link BookingController.BookingListItem}, including the count of items
     * per booking (single batch query to avoid N+1).
     */
    @Transactional(readOnly = true)
    public BookingController.PagedResult<BookingController.BookingListItem> listPaged(
            UUID tenantId, UUID branchId,
            Booking.Status status, Instant from, Instant to, String customerPhone,
            org.springframework.data.domain.Pageable pageable) {

        var pageRes = bookingRepo.searchPaged(tenantId, branchId, status, from, to, customerPhone, pageable);
        var bookings = pageRes.getContent();
        if (bookings.isEmpty()) {
            return new BookingController.PagedResult<>(List.of(), pageRes.getTotalElements(),
                    pageable.getPageNumber(), pageable.getPageSize());
        }

        // Batch-load item counts for the current page to avoid per-row queries.
        var bookingIds = bookings.stream().map(Booking::getId).toList();
        @SuppressWarnings("unchecked")
        var rows = (List<Object[]>) em.createQuery(
                        "SELECT i.bookingId, COUNT(i) FROM BookingItem i " +
                        "WHERE i.bookingId IN :ids GROUP BY i.bookingId")
                .setParameter("ids", bookingIds)
                .getResultList();
        var countByBooking = new java.util.HashMap<UUID, Integer>();
        for (Object[] r : rows) {
            countByBooking.put((UUID) r[0], ((Number) r[1]).intValue());
        }

        var items = bookings.stream().map(b -> new BookingController.BookingListItem(
                b.getId(), b.getCode(), b.getStatus().name(), b.getSource().name(),
                b.getCustomerName(), b.getCustomerPhone(),
                b.getStartAt(), b.getEndAt(), b.getTotalAmount(),
                countByBooking.getOrDefault(b.getId(), 0)
        )).toList();

        return new BookingController.PagedResult<>(items, pageRes.getTotalElements(),
                pageable.getPageNumber(), pageable.getPageSize());
    }

    /** Status timeline read from booking_status_logs (populated by V11 trigger). */
    @PersistenceContext
    private jakarta.persistence.EntityManager em;

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public java.util.List<BookingController.StatusEntry> timeline(UUID bookingId) {
        var rows = (java.util.List<Object[]>) em.createNativeQuery("""
            SELECT from_status, to_status, note, ts
            FROM booking.booking_status_logs
            WHERE booking_id = :bid
            ORDER BY ts ASC
            """)
            .setParameter("bid", bookingId)
            .getResultList();
        return rows.stream().map(r -> new BookingController.StatusEntry(
                (String) r[0],
                (String) r[1],
                (String) r[2],
                ((java.sql.Timestamp) r[3]).toInstant()
        )).toList();
    }

    /** Read-side detail with items for the booking detail page. */
    @Transactional(readOnly = true)
    public BookingController.DetailDto getDetail(UUID bookingId) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Booking not found"));
        var items = itemRepo.findAllByBookingId(b.getId()).stream()
                .map(i -> new BookingController.ItemDetail(
                        i.getId(), i.getServiceCode(), i.getServiceName(),
                        i.getBedId(), i.getRoomId(), i.getStaffId(),
                        i.getStartAt(), i.getEndAt(), i.getDurationMin(), i.getPrice(),
                        i.getStatus()
                )).toList();
        return new BookingController.DetailDto(
                b.getId(), b.getCode(), b.getStatus().name(), b.getSource().name(),
                b.getCustomerName(), b.getCustomerPhone(), b.getCustomerEmail(),
                b.getStartAt(), b.getEndAt(), b.getTotalAmount(), b.getNote(), items
        );
    }

    /** Move one booking_item; DB EXCLUDE catches conflicts. */
    @Transactional
    public BookingController.DetailDto reschedule(UUID bookingId, UUID itemId,
                                                  Instant newStart, Instant newEnd,
                                                  UUID newBedId, UUID newRoomId, UUID newStaffId) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Booking not found"));
        if (b.getStatus() == Booking.Status.cancelled || b.getStatus() == Booking.Status.done) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "Cannot reschedule a " + b.getStatus() + " booking");
        }
        var item = itemRepo.findById(itemId)
                .filter(it -> it.getBookingId().equals(bookingId))
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Item not found"));

        item.setStartAt(newStart);
        item.setEndAt(newEnd);
        if (newBedId != null) item.setBedId(newBedId);
        if (newRoomId != null) item.setRoomId(newRoomId);
        if (newStaffId != null) item.setStaffId(newStaffId);
        item.setDurationMin((int) java.time.temporal.ChronoUnit.MINUTES.between(newStart, newEnd));
        try {
            itemRepo.save(item);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            String msg = ex.getMostSpecificCause() == null ? "" : ex.getMostSpecificCause().getMessage();
            if (msg.contains("excl_bed_no_overlap"))
                throw new AppException(ErrorCodes.BOOKING_SLOT_TAKEN, HttpStatus.CONFLICT, "Bed already booked");
            if (msg.contains("excl_staff_no_overlap"))
                throw new AppException(ErrorCodes.BOOKING_STAFF_BUSY, HttpStatus.CONFLICT, "Staff busy");
            throw ex;
        }

        // Recompute booking window envelope from items.
        var allItems = itemRepo.findAllByBookingId(bookingId);
        b.setStartAt(allItems.stream().map(BookingItem::getStartAt).min(Instant::compareTo).orElse(b.getStartAt()));
        b.setEndAt(allItems.stream().map(BookingItem::getEndAt).max(Instant::compareTo).orElse(b.getEndAt()));
        bookingRepo.save(b);

        outboxRepo.save(new BookingOutboxEvent(
                b.getTenantId(),
                "kaori.booking.rescheduled.v1",
                b.getId().toString(),
                serialize(b)
        ));
        return getDetail(bookingId);
    }

    @Transactional
    public Booking cancel(UUID bookingId, UUID actor, String reason) {
        Booking b = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Booking not found"));
        if (b.getStatus() == Booking.Status.cancelled || b.getStatus() == Booking.Status.done) {
            return b;
        }
        b.setStatus(Booking.Status.cancelled);
        b.setCancelledAt(Instant.now());
        b.setCancelledBy(actor);
        b.setCancelReason(reason);
        bookingRepo.save(b);
        // Trigger sync_item_status() will null out items so the slot frees up.
        outboxRepo.save(new BookingOutboxEvent(
                b.getTenantId(),
                "kaori.booking.cancelled.v1",
                b.getId().toString(),
                serialize(b)
        ));
        return b;
    }

    private void preCheck(UUID tenantId, UUID branchId, ItemCmd it) {
        Bed bed = bedRepo.findById(it.bedId())
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.BAD_REQUEST, "Bed not found"));
        if (!bed.getTenantId().equals(tenantId) || !bed.getBranchId().equals(branchId)) {
            throw new AppException(ErrorCodes.TENANT_MISMATCH, HttpStatus.FORBIDDEN, "Bed not in branch scope");
        }
        if (!bed.isUsable()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                    "Bed " + bed.getCode() + " is not active (status: " + bed.getStatus() + ")");
        }
        if (!bed.getRoomId().equals(it.roomId())) {
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST,
                    "Bed does not belong to room");
        }
        // Bed conflict pre-check (still rely on DB EXCLUDE for the truth).
        var bedOverlap = itemRepo.findBedOverlap(it.bedId(), it.startAt(), it.endAt());
        if (!bedOverlap.isEmpty()) {
            throw new AppException(ErrorCodes.BOOKING_SLOT_TAKEN, HttpStatus.CONFLICT,
                    "Bed already booked overlapping the requested window");
        }

        if (it.staffId() != null) {
            Staff staff = staffRepo.findById(it.staffId())
                    .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.BAD_REQUEST, "Staff not found"));
            if (!staff.getTenantId().equals(tenantId) || !staff.getBranchId().equals(branchId)) {
                throw new AppException(ErrorCodes.TENANT_MISMATCH, HttpStatus.FORBIDDEN, "Staff not in branch scope");
            }
            if (!staff.isActive()) {
                throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Staff inactive");
            }
            // Shift check — staff must be on shift covering the entire window.
            if (!shiftChecker.isOnShift(it.staffId(), it.startAt(), it.endAt(), java.time.ZoneId.of("Asia/Ho_Chi_Minh"))) {
                throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT,
                        "Staff " + staff.getCode() + " is not on shift for the requested time");
            }
            // Skill check (only enforce if any skill rows exist for that service in branch).
            var skillsForService = skillRepo.findByBranchAndService(branchId, it.serviceCode());
            if (!skillsForService.isEmpty() &&
                    skillsForService.stream().noneMatch(s -> s.getId().getStaffId().equals(it.staffId()))) {
                throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.CONFLICT,
                        "Staff missing skill for service " + it.serviceCode());
            }
            var staffOverlap = itemRepo.findStaffOverlap(it.staffId(), it.startAt(), it.endAt());
            if (!staffOverlap.isEmpty()) {
                throw new AppException(ErrorCodes.BOOKING_STAFF_BUSY, HttpStatus.CONFLICT,
                        "Staff already booked overlapping the requested window");
            }
        }
    }

    private String generateCode(UUID tenantId) {
        // Simple year-based code; production may use a sequence or per-day counter.
        String year = String.valueOf(java.time.Year.now().getValue());
        long count = bookingRepo.count();
        return "BK-" + year + "-" + String.format("%06d", count + 1);
    }

    private String serialize(Booking b) {
        try {
            var items = itemRepo.findAllByBookingId(b.getId()).stream()
                    .map(it -> Map.of(
                            "serviceCode", it.getServiceCode(),
                            "staffId", it.getStaffId() == null ? "" : it.getStaffId().toString(),
                            "price", it.getPrice() == null ? "0" : it.getPrice().toPlainString()))
                    .toList();
            var payload = new java.util.HashMap<String, Object>();
            payload.put("tenantId", b.getTenantId().toString());
            payload.put("branchId", b.getBranchId().toString());
            payload.put("bookingId", b.getId().toString());
            payload.put("code", b.getCode());
            payload.put("status", b.getStatus().name());
            payload.put("customer", b.getCustomerName());
            payload.put("phone", b.getCustomerPhone());
            payload.put("locale", b.getLocale());
            payload.put("startAt", b.getStartAt().toString());
            payload.put("endAt", b.getEndAt().toString());
            payload.put("totalAmount", b.getTotalAmount().toPlainString());
            payload.put("items", items);
            return mapper.writeValueAsString(payload);
        } catch (Exception ex) {
            return "{}";
        }
    }

    public record ItemCmd(
            String serviceCode,
            Map<String, String> serviceName,
            UUID bedId,
            UUID roomId,
            UUID staffId,
            Instant startAt,
            Instant endAt,
            BigDecimal price
    ) {}

    public record CreateBookingCmd(
            UUID tenantId,
            UUID branchId,
            UUID customerId,
            String customerName,
            String customerPhone,
            String customerEmail,
            String locale,
            Booking.Source source,
            String note,
            String idempotencyKey,
            UUID createdBy,
            List<ItemCmd> items
    ) {}
}
