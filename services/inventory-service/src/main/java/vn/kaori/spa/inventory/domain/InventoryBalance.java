package vn.kaori.spa.inventory.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "inventory_balances", schema = "inventory")
@Getter @Setter @NoArgsConstructor
public class InventoryBalance {

    @EmbeddedId private Id id;
    @Column(nullable = false) private BigDecimal qty = BigDecimal.ZERO;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt = Instant.now();

    @Embeddable
    @Getter @Setter @NoArgsConstructor
    public static class Id implements Serializable {
        @Column(name = "product_id") private UUID productId;
        @Column(name = "branch_id") private UUID branchId;

        public Id(UUID productId, UUID branchId) { this.productId = productId; this.branchId = branchId; }
        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Id that)) return false;
            return Objects.equals(productId, that.productId) && Objects.equals(branchId, that.branchId);
        }
        @Override public int hashCode() { return Objects.hash(productId, branchId); }
    }
}
