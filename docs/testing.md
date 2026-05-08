# Chiến lược test

## 1. Tỉ trọng

```
       ┌──────────────┐
       │   E2E (5%)   │   Playwright per portal, smoke + critical flow
       ├──────────────┤
       │ Integration  │   Testcontainers (Postgres + Kafka + Redis)
       │   (15%)      │
       ├──────────────┤
       │              │
       │  Component   │   Vitest + RTL (FE), Spring slice tests (BE)
       │   (30%)      │
       ├──────────────┤
       │              │
       │     Unit     │   Pure logic, đa dạng đầu vào
       │   (50%)      │
       └──────────────┘
```

Coverage tối thiểu:
- Service backend: 80% line, 70% branch.
- Frontend: 70% line.
- Hard fail CI nếu drop > 2% so với main.

## 2. Backend (Java)

- JUnit 5 + AssertJ + Mockito.
- Slice test: `@WebMvcTest`, `@DataJpaTest`, `@KafkaTest`.
- Integration: `@SpringBootTest` + `Testcontainers` (Postgres, Kafka, Redis, ClickHouse).
- Contract test: Pact giữa FE và BE cho mọi endpoint.
- Tenant isolation: mọi `*Repository` có test bắt buộc theo template chung — tạo data tenant A, query tenant B → expect empty.

## 3. Backend (Python)

- pytest + pytest-asyncio.
- httpx async client cho FastAPI.
- LLM gateway test:
  - Stub provider (`FakeLLMProvider`) trả response cố định.
  - Golden file cho prompt regression.
- RAG: assert top-k recall trên dataset nhỏ.

## 4. Frontend

- Unit + component: Vitest + Testing Library.
- Hook test: `renderHook` từ RTL.
- MSW mock API cho tests.
- Visual regression: Chromatic / Percy cho component library.
- A11y: axe-core trong test setup.
- E2E: Playwright; mỗi portal có shard riêng:
  - `client-web.spec.ts` — đặt lịch, đăng ký.
  - `branch-admin.spec.ts` — booking flow.
  - `org-admin.spec.ts` — tạo branch, mời user.
  - `tenant-admin.spec.ts` — duyệt tenant, đổi gói.

## 5. i18n test

- CI: `tools/i18n-check.ts` so sánh key giữa 5 file `messages/*.json`. Fail nếu thiếu / thừa.
- Snapshot: render trang chính 5 locale; diff snapshot trong PR.

## 6. Performance test

- k6 (HTTP + WS scenarios), chạy nightly trên môi trường staging-like.
- Benchmark: 1000 booking/phút, 10k WS connections.
- Profile DB query > 100ms qua `pg_stat_statements`.

## 7. Security test

- SAST: Semgrep ruleset OWASP + custom rule (`/tools/semgrep-rules/`).
- Dependency: Snyk / OWASP Dependency Check.
- DAST: ZAP baseline trong staging.
- Skill `/security-review` chạy mỗi PR.

## 8. Data quality test

- ETL → ClickHouse: contract test row count, schema.
- Reconcile job: sum doanh thu OLTP vs OLAP mỗi ngày, alert nếu lệch > 0.1%.

## 9. CI matrix

```
- lint (TS, Java, Python)
- typecheck
- unit (parallel theo package)
- component
- integration (Testcontainers)
- e2e (Playwright shard 4)
- security (Semgrep + audit)
- i18n-check
- coverage gate
```

PR phải pass tất cả mới merge. `main` deploy preview env tự động.
