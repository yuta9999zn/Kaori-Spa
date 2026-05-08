package vn.kaori.spa.booking.payroll;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Builds (or rebuilds) the salary snapshot for a (branch, period). Aggregates
 * commissions from `staff_commissions` joined with attendance counts.
 *
 * For the open period the snapshot can be re-run as often as needed; once the
 * manager calls `lock(period)` the rows freeze (status=locked) and further
 * commissions for that period write to a "carry-over" period instead.
 */
@Service
@RequiredArgsConstructor
public class PayrollService {

    @PersistenceContext
    private EntityManager em;

    private final SalaryRecordRepository salaryRepo;

    @Transactional
    @SuppressWarnings("unchecked")
    public List<SalaryRecord> rebuildPeriod(UUID branchId, YearMonth period) {
        String p = period.toString();   // YYYY-MM
        LocalDate first = period.atDay(1);
        LocalDate last = period.atEndOfMonth();

        // Aggregate commissions.
        var rows = em.createNativeQuery("""
            SELECT s.id AS staff_id, s.tenant_id, s.branch_id,
                   COALESCE(SUM(c.commission_amount), 0) AS commission_total,
                   COALESCE(rate.base_salary, branch.base_salary, 0) AS base_salary
            FROM booking.staff s
            LEFT JOIN booking.staff_commissions c
                ON c.staff_id = s.id
               AND c.earned_at >= :first AND c.earned_at < :nextFirst
            LEFT JOIN booking.staff_commission_rates rate ON rate.staff_id = s.id
            LEFT JOIN booking.branch_commission_defaults branch ON branch.branch_id = s.branch_id
            WHERE s.branch_id = :branchId AND s.is_active = TRUE
            GROUP BY s.id, s.tenant_id, s.branch_id, rate.base_salary, branch.base_salary
            """)
            .setParameter("first", first.atStartOfDay())
            .setParameter("nextFirst", last.plusDays(1).atStartOfDay())
            .setParameter("branchId", branchId)
            .getResultList();

        // Aggregate attendance.
        var att = em.createNativeQuery("""
            SELECT staff_id,
                   COUNT(*) FILTER (WHERE status IN ('present','late','early_out')) AS days_worked,
                   COUNT(*) FILTER (WHERE status = 'off') AS days_off,
                   COUNT(*) FILTER (WHERE status = 'late') AS days_late,
                   COALESCE(SUM(minutes_worked), 0) AS minutes_worked
            FROM booking.attendance_records
            WHERE branch_id = :branchId AND work_date BETWEEN :first AND :last
            GROUP BY staff_id
            """)
            .setParameter("branchId", branchId)
            .setParameter("first", first)
            .setParameter("last", last)
            .getResultList();

        // Map staff_id -> attendance row.
        Map<UUID, Object[]> attMap = ((List<Object[]>) att).stream()
                .collect(java.util.stream.Collectors.toMap(r -> (UUID) r[0], r -> r));

        for (Object o : rows) {
            Object[] r = (Object[]) o;
            UUID staffId   = (UUID) r[0];
            UUID tenantId  = (UUID) r[1];
            UUID brId      = (UUID) r[2];
            BigDecimal commission = (BigDecimal) r[3];
            BigDecimal baseSal    = (BigDecimal) r[4];

            Object[] a = attMap.get(staffId);
            int daysWorked = a == null ? 0 : ((Number) a[1]).intValue();
            int daysOff    = a == null ? 0 : ((Number) a[2]).intValue();
            int daysLate   = a == null ? 0 : ((Number) a[3]).intValue();
            int minutesWorked = a == null ? 0 : ((Number) a[4]).intValue();

            BigDecimal net = baseSal.add(commission)
                    .subtract(BigDecimal.ZERO)
                    .setScale(0, RoundingMode.HALF_UP);

            SalaryRecord rec = salaryRepo
                    .findByStaffIdAndPeriod(staffId, p)
                    .orElseGet(SalaryRecord::new);
            if (rec.getStatus() == SalaryRecord.Status.locked || rec.getStatus() == SalaryRecord.Status.paid) {
                continue;  // do not touch locked rows.
            }
            rec.setTenantId(tenantId);
            rec.setBranchId(brId);
            rec.setStaffId(staffId);
            rec.setPeriod(p);
            rec.setBaseSalary(baseSal);
            rec.setCommissionTotal(commission);
            rec.setDaysWorked(daysWorked);
            rec.setDaysOff(daysOff);
            rec.setDaysLate(daysLate);
            rec.setMinutesWorked(minutesWorked);
            rec.setNet(net);
            salaryRepo.save(rec);
        }
        return salaryRepo.findAllByBranchIdAndPeriod(branchId, p);
    }

    @Transactional
    public void lock(UUID branchId, YearMonth period, UUID by) {
        var rows = salaryRepo.findAllByBranchIdAndPeriod(branchId, period.toString());
        for (var r : rows) {
            if (r.getStatus() == SalaryRecord.Status.open) {
                r.setStatus(SalaryRecord.Status.locked);
                r.setLockedAt(java.time.Instant.now());
                r.setLockedBy(by);
                salaryRepo.save(r);
            }
        }
    }
}
