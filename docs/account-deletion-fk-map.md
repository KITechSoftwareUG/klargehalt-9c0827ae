# Account Deletion — FK Map & Table Classification (Phase 0)

> Source of truth: live schema dump (`supabase db dump --linked --schema public`,
> project `btbucjkczpejplykyvkj`, taken 2026-05-16). **33 real tables** — the
> migration history suggested ~60 but many were never created in prod / archived.
> Re-verify with a fresh dump if the schema changes before this ships.

## Hard legal constraint

`law.md §5` (Beweislastumkehr) + `security.md §5/§9`: the append-only compliance
trail is retention-obligated. A naive `DELETE FROM companies` would
`ON DELETE CASCADE` straight through `audit_logs` and `user_roles` — wiping the
legal paper-trail. **The companies row is never hard-deleted**; it is the anchor
that keeps the frozen trail joinable and prevents the cascade.

## Critical Phase-0 corrections to the original plan

1. **`audit_logs` is a hash chain** (`sequence_number`, `previous_hash`,
   `record_hash`). Mutating *any* column (incl. the originally-planned
   `user_email → NULL`) breaks chain verification and destroys the integrity
   guarantee that is the whole point of the audit trail. → **Freeze untouched.**
   The PII it contains is retained under **DSGVO Art. 17(3)(b)** (legal-obligation
   exception); document this in the privacy notice (Phase 8).
2. **Structural skeleton is retained, not deleted.** `departments`,
   `job_levels`, `job_profiles`, `pay_bands` carry **no personal data**, and the
   retained `salary_decisions` reference `pay_band_id` + snapshot `comparator_data`.
   Keeping them makes the frozen trail *interpretable and defensible*. It also
   avoids `NO ACTION` FK aborts (`employees.department_id → departments`,
   `pay_bands.job_level_id → job_levels`, `job_profiles.* → departments/job_levels`
   have no `ON DELETE`, so deleting them while pseudonymized `employees` survive
   would throw and abort the whole transaction).
3. **`lawyer_reviews` is retained** (Pillar #5 External Validation — defensible
   evidence, no employee PII). Only the operational lawyer flow
   (`lawyer_access_grants`) is deleted. `salary_decisions.lawyer_review_id`
   stays intact.
4. **`employees` rows are kept, never deleted** — `salary_decisions.employee_id
   → employees ON DELETE CASCADE`. Deleting an employee would cascade-delete its
   salary decisions. Only PII columns are pseudonymized.

## Classification (the 33 live tables)

### A. Freeze — retain untouched (legal trail + idempotency ledgers)
`salary_decisions`, `audit_logs` (hash chain — **no mutation**),
`subscription_changes`, `processed_stripe_events`, `processed_logto_events`,
`lawyer_reviews`.

### B. Freeze — retain as structural context (no PII)
`departments`, `job_levels`, `job_profiles`, `pay_bands`.

### C. Pseudonymize in place (keep row, strip direct identifiers)
**`employees`** — NOT NULL cols get placeholders, not NULL:
| column | action |
|---|---|
| `first_name` | → `'Gelöscht'` |
| `last_name` | → `'MA-' \|\| left(id::text,8)` |
| `email` | → `'deleted-' \|\| id \|\| '@anonymized.invalid'` (NOT NULL) |
| `employee_number`, `user_id`, `department` (free text), `created_by`, `salary_justification_updated_by` | → `NULL` |
| `salary_justification` | → `'{}'::jsonb` |
| **kept** (de-identified compliance substance) | `gender`, `current_salary`, `base_salary`, `variable_pay`, `hire_date`, `birth_year`, structural FKs |

**`companies`** (keep row — anchor):
`name → 'Gelöschtes Unternehmen'`; `legal_name, tax_id, address,
stripe_customer_id, stripe_subscription_id, logo_url, created_by → NULL`;
`is_active = false`; set `deletion_status='anonymized'`,
`deletion_executed_at = now()`. Keep `organization_id` (trail join key) and
`subscription_*` (billing-history coherence).

**`organization_members`**: all rows `status='removed'`. `user_id` kept (audit
actor integrity).

### D. Hard-delete (operational, PII-bearing or no retention value)
FK-safe order (child → parent), all filtered by `organization_id` or
`company_id`:

1. `certified_snapshots`, `assessment_transitions`, `legal_review_comments`
2. `compliance_assessments`
3. `joint_assessment_justifications`
4. `joint_assessments`  *(has `snapshot_id → pay_gap_snapshots`, NO ACTION → must precede #6)*
5. `employee_comparisons`, `pay_group_stats`, `gender_gap_history`, `salary_simulations`
6. `pay_groups`, `pay_gap_snapshots`
7. `info_requests`, `job_postings`, `onboarding_data`, `rights_notifications`,
   `consultation_bookings`, `lawyer_access_grants`, `profiles`, `user_roles`

### E. Leave (global / service-role infra, no tenant data)
`plans`, `rate_limit_entries`.

## Relevant FK edges (from live dump)

```
audit_logs.company_id            → companies(id)              ON DELETE CASCADE   [why companies row must survive]
user_roles.company_id            → companies(id)              ON DELETE CASCADE
salary_decisions.employee_id     → employees(id)              ON DELETE CASCADE   [why employees rows survive]
salary_decisions.pay_band_id     → pay_bands(id)              ON DELETE SET NULL
salary_decisions.lawyer_review_id→ lawyer_reviews(id)         ON DELETE SET NULL
employees.company_id             → companies(id)              ON DELETE CASCADE
employees.department_id          → departments(id)            (NO ACTION)         [why departments retained]
employees.job_profile_id         → job_profiles(id)           ON DELETE SET NULL
employees.pay_band_id            → pay_bands(id)               ON DELETE SET NULL
pay_bands.job_level_id           → job_levels(id)              (NO ACTION)         [why job_levels retained]
pay_bands.job_profile_id         → job_profiles(id)            ON DELETE CASCADE
job_profiles.department_id       → departments(id)             (NO ACTION)
job_profiles.job_level_id        → job_levels(id)              (NO ACTION)
joint_assessments.snapshot_id    → pay_gap_snapshots(id)       (NO ACTION)         [delete joint_assessments before pay_gap_snapshots]
certified_snapshots.assessment_id→ compliance_assessments(id)  (NO ACTION)         [delete certified_snapshots before compliance_assessments]
assessment_transitions.assessment_id   → compliance_assessments(id) ON DELETE CASCADE
legal_review_comments.assessment_id    → compliance_assessments(id) ON DELETE CASCADE
joint_assessment_justifications.assessment_id → joint_assessments(id) ON DELETE CASCADE
employee_comparisons / pay_group_stats / gender_gap_history / salary_simulations . pay_group_id → pay_groups(id) ON DELETE CASCADE
```

## Residual-risk note (carry to Phase 8 privacy notice)
`salary_decisions.justification_text` (free text, the legally-required
justification) and `audit_logs` payloads may contain a name a user typed. These
are **retained deliberately** under DSGVO Art. 17(3)(b) — the EU 2023/970
Beweislast obligation overrides erasure for this specific category. Nulling them
would destroy the defensible-trail value the product exists to provide. Backups
have a 7-day tail (Supabase retention) — also documented in the privacy notice.
