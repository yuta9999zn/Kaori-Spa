package vn.kaori.spa.inventory.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inventory_moves", schema = "inventory")
@Getter @Setter @NoArgsConstructor
public class InventoryMove {

    public enum MoveType { in, out, adjust, transfer }

    @Id @GeneratedValue private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "branch_id", nullable = false, updatable = false) private UUID branchId;
    @Column(name = "product_id", nullable = false, updatable = false) private UUID productId;
    @Column(nullable = false, updatable = false) private BigDecimal delta;

    @Enumerated(EnumType.STRING)
    @Column(name = "move_type", nullable = false, updatable = false)
    private MoveType moveType;

    @Column(name = "ref_type") private String refType;
    @Column(name = "ref_id") private UUID refId;
    @Column private String note;
    @Column(name = "actor_id") private UUID actorId;
    @Column(name = "occurred_at", nullable = false) private Instant occurredAt = Instant.now();
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
