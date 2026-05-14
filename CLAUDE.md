# CLAUDE.md

## What This Is

**klargehalt** — B2B SaaS for EU pay-transparency compliance (Entgelttransparenzrichtlinie 2023/970).
Target: German/EU companies (100–500 employees) proving fair salaries. Buyer: CEO or HR Lead.

**We sell:** "If someone asks or sues — you are prepared. And an external lawyer has already reviewed it."
**Not:** "Transparent salary bands."

### The 5 Core Pillars

| Pillar | Code meaning |
|---|---|
| **1. Compensation Structure** | Job profiles, levels, pay bands |
| **2. Decision Documentation** | `salary_decisions` — every salary event with justification — **this is the product** |
| **3. Gap Detection** | Flags >5% gender/group pay gaps — legal obligation |
| **4. Audit Trail** | Immutable, timestamped per-employee history |
| **5. External Validation** | Vetted lawyer reviews via KlarGehalt — defensible paper trail |

**Critical wording:** Never "rechtssicher" / "gesetzlich geprüft". Only "von externem Rechtsberater geprüft".

---

## ⚠️ Security First

klargehalt verarbeitet Gehälter, Geschlechts-Daten (DSGVO Art. 9) und Compliance-Dokumentation für Rechtsstreitigkeiten. **Security ist nicht-verhandelbar.**

**Bei jeder Änderung an Auth, RLS, API-Routes, Webhooks, Forms oder neuen Tabellen ZUERST → @.claude/docs/security.md lesen.** Die Datei enthält Threat-Model, Defense-in-Depth, DSGVO-Pflichten, Pre-Commit-Checkliste und "Wenn unsicher — STOP"-Regeln.

---

## Project Documentation

Detailliertere Themen sind in `.claude/docs/` ausgelagert und werden über @-Imports automatisch beim Start geladen:

- **🔒 Security** (Threat-Model, RLS, DSGVO, Pre-Commit-Checkliste) → @.claude/docs/security.md
- **⚖️ Law** (EU-Entgelttransparenzrichtlinie 2023/970 — Pflichten, Fristen, Wording-Regeln) → @.claude/docs/law.md
- **Product, MVP, Build Status** → @.claude/docs/product.md
- **Stack & Commands** (inkl. Chrome-Testing-Regel) → @.claude/docs/stack.md
- **Architecture & Auth Patterns** → @.claude/docs/architecture.md
- **RBAC, Team-Invites & Subscription** → @.claude/docs/rbac-team.md
- **Routes, API, Datenbank & Hooks** → @.claude/docs/routes-data.md
- **Environment, Mail & DNS** → @.claude/docs/infra.md
- **🔑 Access & Deployments** (Coolify-Projekte, App-UUIDs, Supabase-Link, Logto/Sentry/Stripe-Konsolen, Deploy-Commands) → @.claude/docs/access.md
- **Failure Modes & MCP Tools** → @.claude/docs/operations.md
- **Behavioral Guidelines** → @.claude/docs/behavior.md
