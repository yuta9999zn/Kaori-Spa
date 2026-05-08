package vn.kaori.spa.booking.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findAllByBookingIdOrderByPaidAtDesc(UUID bookingId);
    List<Transaction> findAllByBranchIdAndPaidAtBetween(UUID branchId, Instant from, Instant to);
}
