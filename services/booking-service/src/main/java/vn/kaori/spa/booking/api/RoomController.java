package vn.kaori.spa.booking.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.kaori.spa.booking.domain.Bed;
import vn.kaori.spa.booking.domain.Repositories.BedRepository;
import vn.kaori.spa.booking.domain.Repositories.RoomRepository;
import vn.kaori.spa.booking.domain.Room;
import vn.kaori.spa.shared.api.ApiResponse;
import vn.kaori.spa.shared.audit.Audited;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomRepository roomRepo;
    private final BedRepository bedRepo;

    public record RoomDto(UUID id, String code, Map<String, String> name, String roomType,
                          Integer floor, int capacityBeds, boolean active, List<BedDto> beds) {}

    public record BedDto(UUID id, String code, Map<String, String> name, String bedType, String status) {}

    public record CreateRoomReq(@NotNull UUID tenantId, @NotNull UUID branchId,
                                @NotBlank String code, @NotBlank String nameVi,
                                String roomType, Integer floor, Integer capacityBeds) {}

    public record CreateBedReq(@NotBlank String code, @NotBlank String nameVi,
                               String bedType, String status, String notes) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER','RECEPTIONIST')")
    public ApiResponse<List<RoomDto>> list(@RequestParam UUID tenantId, @RequestParam UUID branchId) {
        var rooms = roomRepo.findAllByTenantIdAndBranchIdAndActiveTrue(tenantId, branchId);
        return ApiResponse.ok(rooms.stream().map(this::toDtoWithBeds).toList());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "room.create", entityType = "room", entityIdExpression = "#req.code")
    public ApiResponse<RoomDto> create(@Valid @RequestBody CreateRoomReq req) {
        if (roomRepo.findByBranchIdAndCode(req.branchId(), req.code()).isPresent()) {
            throw new AppException(ErrorCodes.CONFLICT, HttpStatus.CONFLICT, "Room code exists");
        }
        Room r = new Room();
        r.setTenantId(req.tenantId());
        r.setBranchId(req.branchId());
        r.setCode(req.code());
        r.getName().put("vi", req.nameVi());
        if (req.roomType() != null) r.setRoomType(req.roomType());
        r.setFloor(req.floor());
        if (req.capacityBeds() != null) r.setCapacityBeds(req.capacityBeds());
        return ApiResponse.ok(toDtoWithBeds(roomRepo.save(r)));
    }

    @PostMapping("/{roomId}/beds")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "bed.create", entityType = "bed", entityIdExpression = "#req.code")
    public ApiResponse<BedDto> addBed(@PathVariable UUID roomId, @Valid @RequestBody CreateBedReq req) {
        Room r = roomRepo.findById(roomId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Room not found"));
        Bed b = new Bed();
        b.setTenantId(r.getTenantId());
        b.setBranchId(r.getBranchId());
        b.setRoomId(r.getId());
        b.setCode(req.code());
        b.getName().put("vi", req.nameVi());
        if (req.bedType() != null) b.setBedType(req.bedType());
        if (req.status() != null) b.setStatus(req.status());
        b.setNotes(req.notes());
        b = bedRepo.save(b);
        return ApiResponse.ok(toBed(b));
    }

    @PutMapping("/beds/{bedId}/status")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER','ORG_OWNER','TENANT_OWNER')")
    @Audited(action = "bed.status", entityType = "bed", entityIdExpression = "#bedId")
    public ApiResponse<BedDto> setBedStatus(@PathVariable UUID bedId, @RequestBody Map<String, String> body) {
        Bed b = bedRepo.findById(bedId)
                .orElseThrow(() -> new AppException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, "Bed not found"));
        String s = body.getOrDefault("status", "active");
        if (!List.of("active", "maintenance", "retired").contains(s)) {
            throw new AppException(ErrorCodes.VALIDATION_FAILED, HttpStatus.BAD_REQUEST, "invalid status");
        }
        b.setStatus(s);
        return ApiResponse.ok(toBed(bedRepo.save(b)));
    }

    private RoomDto toDtoWithBeds(Room r) {
        var beds = bedRepo.findAllByRoomId(r.getId()).stream().map(this::toBed).toList();
        return new RoomDto(r.getId(), r.getCode(), r.getName(), r.getRoomType(),
                r.getFloor(), r.getCapacityBeds(), r.isActive(), beds);
    }

    private BedDto toBed(Bed b) {
        return new BedDto(b.getId(), b.getCode(), b.getName(), b.getBedType(), b.getStatus());
    }
}
