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
| 8 | `decision_documentation` missing from `FEATURE_FLAGS` | `hasFeature()` always false | Add to FEATURE_FLAGS |
| 9 | pg_cron `cleanup_expired_trial_accounts` not scheduled | No detection | Run `SELECT cron.schedule(...)` in Supabase SQL editor |

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
