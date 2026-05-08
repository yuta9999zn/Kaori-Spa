package vn.kaori.spa.shared.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Mark a controller / service method to emit an audit event after it returns
 * successfully. The aspect captures actor (from TenantContext), action,
 * entity, and request body / result snapshot, then publishes to Kafka topic
 * {@code kaori.audit.event.v1}.
 *
 * Usage:
 * <pre>{@code
 * @Audited(action = "branch.create", entityType = "branch")
 * public Branch create(...) { ... }
 * }</pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {
    String action();
    String entityType();
    /** SpEL expression evaluated against args (e.g. "#req.code"). */
    String entityIdExpression() default "";
}
