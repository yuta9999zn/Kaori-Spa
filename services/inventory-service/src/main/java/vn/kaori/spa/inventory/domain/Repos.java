package vn.kaori.spa.inventory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public final class Repos {
    private Repos() {}

    public interface ProductRepository extends JpaRepository<Product, UUID> {
        List<Product> findAllByOrgIdAndActiveTrue(UUID orgId);
        Optional<Product> findByOrgIdAndCode(UUID orgId, String code);
    }

    public interface InventoryMoveRepository extends JpaRepository<InventoryMove, UUID> {
        List<InventoryMove> findAllByBranchIdOrderByOccurredAtDesc(UUID branchId);
        List<InventoryMove> findAllByProductIdOrderByOccurredAtDesc(UUID productId);
    }

    public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, InventoryBalance.Id> {
        List<InventoryBalance> findAllByIdBranchId(UUID branchId);
    }
}
