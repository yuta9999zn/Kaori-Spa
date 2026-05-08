package vn.kaori.spa.shared.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import vn.kaori.spa.shared.security.TenantContext;

import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditAspect {

    private final ObjectMapper mapper = new ObjectMapper();
    private final SpelExpressionParser spel = new SpelExpressionParser();

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired(required = false)
    private HttpServletRequest httpRequest;

    /**
     * Optional. When present, the aspect will best-effort mirror each audit
     * event into {@code tenant.audit_event} so HTTP read APIs (e.g. the
     * tenant-admin /audit page) can query without going through ClickHouse.
     * Services without a DataSource (e.g. realtime-gateway) just publish to
     * Kafka.
     */
    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @Around("@annotation(vn.kaori.spa.shared.audit.Audited)")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        Object out = pjp.proceed();
        try {
            publish(pjp, out);
        } catch (Exception ex) {
            // Audit must never break business flow.
            log.error("Failed to publish audit event", ex);
        }
        return out;
    }

    private void publish(ProceedingJoinPoint pjp, Object result) throws Exception {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        Method method = sig.getMethod();
        Audited a = method.getAnnotation(Audited.class);
        if (a == null) return;
        if (kafkaTemplate == null && jdbcTemplate == null) return;

        String entityId = "";
        if (!a.entityIdExpression().isBlank()) {
            StandardEvaluationContext ctx = new StandardEvaluationContext();
            String[] paramNames = sig.getParameterNames();
            Object[] args = pjp.getArgs();
            for (int i = 0; i < paramNames.length; i++) {
                ctx.setVariable(paramNames[i], args[i]);
            }
            Object v = spel.parseExpression(a.entityIdExpression()).getValue(ctx);
            entityId = v == null ? "" : String.valueOf(v);
        }

        TenantContext.Principal p = TenantContext.get();
        UUID tenantId = p == null ? null : p.tenantId();
        UUID actorId = p == null ? null : p.userId();
        String ip = httpRequest == null ? null : httpRequest.getRemoteAddr();
        String ua = httpRequest == null ? null : httpRequest.getHeader("User-Agent");
        Instant now = Instant.now();

        Map<String, Object> evt = new HashMap<>();
        evt.put("ts", now.toString());
        evt.put("tenantId", tenantId == null ? null : tenantId.toString());
        evt.put("actorId", actorId == null ? null : actorId.toString());
        evt.put("action", a.action());
        evt.put("entityType", a.entityType());
        evt.put("entityId", entityId);
        evt.put("ip", ip);
        evt.put("ua", ua);

        String payload = mapper.writeValueAsString(evt);

        if (kafkaTemplate != null) {
            kafkaTemplate.send("kaori.audit.event.v1",
                    tenantId == null ? "system" : tenantId.toString(), payload);
        }

        // Best-effort mirror to Postgres so HTTP read endpoints can serve
        // recent events without going through Kafka/ClickHouse. Failures
        // here MUST NOT break the business flow.
        if (jdbcTemplate != null) {
            try {
                jdbcTemplate.update(
                        "INSERT INTO tenant.audit_event "
                                + "(ts, tenant_id, actor_id, action, entity_type, entity_id, ip, user_agent, payload) "
                                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)",
                        Timestamp.from(now),
                        tenantId,
                        actorId,
                        a.action(),
                        a.entityType(),
                        entityId == null || entityId.isBlank() ? null : entityId,
                        ip,
                        ua,
                        payload
                );
            } catch (Exception e) {
                log.warn("Failed to mirror audit event to Postgres (action={})", a.action(), e);
            }
        }
    }
}
