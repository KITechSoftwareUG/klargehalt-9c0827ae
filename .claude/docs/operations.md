# Operations: Failure Modes & MCP Tools

## Hard Failure Modes

| # | Failure | Detection | Fix |
|---|---|---|---|
| 1 | Stripe customer created, `stripe_customer_id` not written to Supabase | `GET /api/stripe/reconcile` | `POST /api/stripe/reconcile` |
| 2 | Stripe webhook fires, Supabase down | Stripe retries 3 days | Retries + reconcile |
| 3 | No cron job for trial reminders | Check Coolify cron | Configure Coolify task → `/api/cron/trial-reminder` |
| 4 | Logto `User.Created` fires twice | No idempotency | Add `processed_logto_events` table (P1) |
| 5 | `?plan=` on `/sign-in` URL (not `/sign-up`) | No detection | Route sign-in `?plan=` to cookie same as sign-up |
| 7 | `RESEND_API_KEY` missing | First send throws | Add startup env check |
| 9 | pg_cron `cleanup_expired_trial_accounts` not scheduled | No detection | Run `SELECT cron.schedule(...)` in Supabase SQL editor |
| 11 | `account-cleanup` cron not scheduled → tenants scheduled for deletion never get pseudonymized (PII retained past the 30-day promise + privacy-notice mismatch) | Check Coolify cron | Configure Coolify task → `GET /api/cron/account-cleanup` (header `x-cron-secret: $CRON_SECRET`), daily. Deferred until migration `20260516120000` is `supabase db push`-ed to prod. |

### Resolved (historical context)

| # | Failure | Resolution |
|---|---|---|
| 8 | `decision_documentation` missing from `FEATURE_FLAGS` | ✅ Added to `lib/subscription.ts` (line 28). `hasFeature('decision_documentation')` now returns true for all tiers. |
| 10 | `pay_gap_snapshots` schema drift — trigger inserted into non-existent columns (`male_mean_base_salary`, `q1_male_pct`, `requires_joint_assessment`); every employee INSERT failed with PG 42703 (also broke CSV-Import with cryptic "Fehler beim Erstellen") | ✅ Fixed in Migration `20260515150000_fix_pay_gap_snapshot_schema_drift.sql` (PR #43). Added missing quartile + `requires_joint_assessment` columns; replaced `refresh_pay_gap_snapshot()` with correct column names (`male_mean_base` not `male_mean_base_salary`). |

---

## MCP Tools: code-review-graph

**ALWAYS use code-review-graph tools BEFORE Grep/Glob/Read to explore the codebase.**

| Tool | Use when |
|---|---|
| `detect_changes` | Code review — risk-scored analysis |
| `get_review_context` | Source snippets — token-efficient |
| `get_impact_radius` | Blast radius of a change |
| `get_affected_flows` | Which execution paths are impacted |
| `query_graph` | Callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Find functions/classes by name or keyword |
| `get_architecture_overview` | High-level structure |

Fall back to Grep/Read only when the graph doesn't cover what you need.
