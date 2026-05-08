package vn.kaori.spa.inventory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, InventoryBalance.Id> {
    List<InventoryBalance> findAllByIdBranchId(UUID branchId);
}
