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
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import vn.kaori.spa.shared.security.TenantContext;

import java.lang.reflect.Method;
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
        if (kafkaTemplate == null) return;
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        Method method = sig.getMethod();
        Audited a = method.getAnnotation(Audited.class);
        if (a == null) return;

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

        Map<String, Object> evt = new HashMap<>();
        evt.put("ts", Instant.now().toString());
        evt.put("tenantId", tenantId == null ? null : tenantId.toString());
        evt.put("actorId", actorId == null ? null : actorId.toString());
        evt.put("action", a.action());
        evt.put("entityType", a.entityType());
        evt.put("entityId", entityId);
        evt.put("ip", httpRequest == null ? null : httpRequest.getRemoteAddr());
        evt.put("ua", httpRequest == null ? null : httpRequest.getHeader("User-Agent"));

        String payload = mapper.writeValueAsString(evt);
        kafkaTemplate.send("kaori.audit.event.v1",
                tenantId == null ? "system" : tenantId.toString(), payload);
    }
}
