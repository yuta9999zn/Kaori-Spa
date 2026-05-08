package vn.kaori.spa.shared.security;

import org.springframework.stereotype.Component;
import vn.kaori.spa.shared.error.AppException;
import vn.kaori.spa.shared.error.ErrorCodes;
import org.springframework.http.HttpStatus;

import java.util.UUID;

/**
 * Centralised authorization check. Verifies that the current principal has the
 * given permission AND that the resource being acted on belongs to the same
 * tenant scope.
 *
 * Use:
 *   permissionGuard.require("booking:create", branchId);
 */
@Component
public class PermissionGuard {

    public void require(String permission) {
        TenantContext.Principal p = TenantContext.get();
        if (p == null || !p.permissions().contains(permission)) {
            throw new AppException(
                    ErrorCodes.PERM_DENIED,
                    HttpStatus.FORBIDDEN,
                    "Missing permission: " + permission
            );
        }
    }

    public void require(String permission, UUID branchScope) {
        require(permission);
        TenantContext.Principal p = TenantContext.get();
        if (branchScope != null && p.branchId() != null && !branchScope.equals(p.branchId())) {
            throw new AppException(
                    ErrorCodes.TENANT_MISMATCH,
                    HttpStatus.FORBIDDEN,
                    "Branch scope mismatch"
            );
        }
    }
}
