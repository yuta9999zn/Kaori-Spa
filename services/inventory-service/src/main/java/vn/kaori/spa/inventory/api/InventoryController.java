package vn.kaori.spa.inventory.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.inventory.domain.*;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final ProductRepository productRepo;
    private final InventoryMoveRepository moveRepo;
    private final InventoryBalanceRepository balanceRepo;

    public record ProductDto(UUID id, String code, Map<String, String> name, String sku,
                             String unit, BigDecimal basePrice, String category, boolean active) {}

    public record StockRow(UUID productId, String productCode, Map<String, String> productName,
                           String unit, BigDecimal qty) {}

    public record MoveDto(UUID id, UUID productId, BigDecimal delta, String moveType,
                          String refType, UUID refId, String note, Instant occurredAt) {}

    public record CreateProductReq(@NotNull UUID tenantId, @NotNull UUID orgId,
                                   @NotBlank String code, @NotBlank String nameVi,
                                   String sku, String unit, BigDecimal basePrice, String category) {}

    public record MoveReq(@NotNull UUID tenantId, @NotNull UUID branchId,
                          @NotNull UUID productId, @NotNull BigDecimal delta,
                          @NotBlank String moveType, String refType, UUID refId, String note) {}

    @GetMapping("/products")
    public ApiResponse<List<ProductDto>> products(@RequestParam UUID orgId) {
        return ApiResponse.ok(productRepo.findAllByOrgIdAndActiveTrue(orgId)
                .stream().map(this::toProduct).toList());
    }

    @PostMapping("/products")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "product.create", entityType = "product", entityIdExpression = "#req.code")
    public ApiResponse<ProductDto> createProduct(@Valid @RequestBody CreateProductReq req) {
        if (productRepo.findByOrgIdAndCode(req.orgId(), req.code()).isPresent()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Product code exists");
        }
        Product p = new Product();
        p.setTenantId(req.tenantId());
        p.setOrgId(req.orgId());
        p.setCode(req.code());
        p.getName().put("vi", req.nameVi());
        p.setSku(req.sku());
        if (req.unit() != null) p.setUnit(req.unit());
        if (req.basePrice() != null) p.setBasePrice(req.basePrice());
        p.setCategory(req.category());
        return ApiResponse.ok(toProduct(productRepo.save(p)));
    }

    @GetMapping("/stock")
    public ApiResponse<List<StockRow>> stock(@RequestParam UUID branchId) {
        var balances = balanceRepo.findAllByIdBranchId(branchId);
        var ids = balances.stream().map(b -> b.getId().getProductId()).toList();
        var products = productRepo.findAllById(ids).stream()
                .collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));
        return ApiResponse.ok(balances.stream().map(b -> {
            var p = products.get(b.getId().getProductId());
            return new StockRow(
                    b.getId().getProductId(),
                    p == null ? null : p.getCode(),
                    p == null ? null : p.getName(),
                    p == null ? null : p.getUnit(),
                    b.getQty()
            );
        }).toList());
    }

    @PostMapping("/moves")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','RECEPTIONIST','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "inventory.move", entityType = "inventory_move", entityIdExpression = "#req.productId")
    @Transactional
    public ApiResponse<MoveDto> move(@Valid @RequestBody MoveReq req) {
        Product p = productRepo.findById(req.productId())
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Product not found"));
        if (!p.getTenantId().equals(req.tenantId())) {
            throw new AppException(ErrorCodes.TENANT_MISMATCH, HttpStatus.FORBIDDEN, "Tenant mismatch");
        }
        InventoryMove m = new InventoryMove();
        m.setTenantId(req.tenantId());
        m.setBranchId(req.branchId());
        m.setProductId(req.productId());
        m.setDelta(req.delta());
        m.setMoveType(InventoryMove.MoveType.valueOf(req.moveType()));
        m.setRefType(req.refType());
        m.setRefId(req.refId());
        m.setNote(req.note());
        m = moveRepo.save(m);
        return ApiResponse.ok(toMove(m));
    }

    @GetMapping("/moves")
    public ApiResponse<List<MoveDto>> moves(@RequestParam(required = false) UUID branchId,
                                            @RequestParam(required = false) UUID productId) {
        if (productId != null) {
            return ApiResponse.ok(moveRepo.findAllByProductIdOrderByOccurredAtDesc(productId)
                    .stream().map(this::toMove).toList());
        }
        if (branchId == null) {
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, "branchId or productId required");
        }
        return ApiResponse.ok(moveRepo.findAllByBranchIdOrderByOccurredAtDesc(branchId)
                .stream().map(this::toMove).toList());
    }

    private ProductDto toProduct(Product p) {
        return new ProductDto(p.getId(), p.getCode(), p.getName(), p.getSku(),
                p.getUnit(), p.getBasePrice(), p.getCategory(), p.isActive());
    }

    private MoveDto toMove(InventoryMove m) {
        return new MoveDto(m.getId(), m.getProductId(), m.getDelta(),
                m.getMoveType().name(), m.getRefType(), m.getRefId(),
                m.getNote(), m.getOccurredAt());
    }
}
