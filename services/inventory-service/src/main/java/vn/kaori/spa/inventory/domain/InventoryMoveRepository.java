package vn.kaori.spa.inventory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InventoryMoveRepository extends JpaRepository<InventoryMove, UUID> {
    List<InventoryMove> findAllByBranchIdOrderByOccurredAtDesc(UUID branchId);
    List<InventoryMove> findAllByProductIdOrderByOccurredAtDesc(UUID productId);
}
