package vn.kaori.spa.notification.template;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Renders a notification template with locale fallback chain:
 *   tenant + locale  →  global + locale  →  tenant + en  →  global + en
 *
 * Variables use {{name}} mustache style. Missing values render as empty
 * string so a partial template still produces something sensible (the
 * common failure mode is "we forgot to pass branchName" which is harmless).
 */
@Service
@RequiredArgsConstructor
public class TemplateRenderer {

    private static final Pattern VAR = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_.]+)\\s*}}");

    @PersistenceContext
    private EntityManager em;

    public record Rendered(String subject, String body) {}

    public Rendered render(UUID tenantId, String code, String channel, String locale,
                           Map<String, Object> vars) {
        var hit = lookup(tenantId, code, channel, locale);
        if (hit == null && !"en".equals(locale)) hit = lookup(tenantId, code, channel, "en");
        if (hit == null) return new Rendered(null, "");

        return new Rendered(replace(hit[0], vars), replace(hit[1], vars));
    }

    @SuppressWarnings("unchecked")
    private String[] lookup(UUID tenantId, String code, String channel, String locale) {
        // Try tenant-specific first, fall back to global.
        for (UUID tid : new UUID[]{ tenantId, null }) {
            var rows = (List<Object[]>) em.createNativeQuery("""
                SELECT subject, body FROM notification.notification_templates
                WHERE code = :code AND channel = :channel AND locale = :locale
                  AND COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)
                      = COALESCE(:tid, '00000000-0000-0000-0000-000000000000'::uuid)
                  AND is_active = TRUE
                LIMIT 1
                """)
                .setParameter("code", code)
                .setParameter("channel", channel)
                .setParameter("locale", locale)
                .setParameter("tid", tid)
                .getResultList();
            if (!rows.isEmpty()) {
                Object[] r = rows.get(0);
                return new String[]{ (String) r[0], (String) r[1] };
            }
        }
        return null;
    }

    private String replace(String template, Map<String, Object> vars) {
        if (template == null) return null;
        Matcher m = VAR.matcher(template);
        StringBuilder out = new StringBuilder();
        while (m.find()) {
            Object v = vars == null ? null : vars.get(m.group(1));
            m.appendReplacement(out, Matcher.quoteReplacement(v == null ? "" : v.toString()));
        }
        m.appendTail(out);
        return out.toString();
    }
}
