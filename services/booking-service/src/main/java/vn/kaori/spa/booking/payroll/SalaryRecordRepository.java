package vn.kaori.spa.booking.payroll;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SalaryRecordRepository extends JpaRepository<SalaryRecord, UUID> {
    List<SalaryRecord> findAllByBranchIdAndPeriod(UUID branchId, String period);
    Optional<SalaryRecord> findByStaffIdAndPeriod(UUID staffId, String period);
}
