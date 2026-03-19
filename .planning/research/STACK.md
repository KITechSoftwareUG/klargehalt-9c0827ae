# Technology Stack — KlarGehalt Business Logic Milestone

**Project:** KlarGehalt (EU pay transparency SaaS)
**Researched:** 2026-03-19
**Scope:** Libraries and patterns needed to add business logic to the existing Next.js 15 + Supabase stack.

---

## What Is Already Decided (Do Not Change)

The following are fixed constraints from `.planning/PROJECT.md`:

| Technology | Version | Status |
|------------|---------|--------|
| Next.js | 15.1.6 | Locked |
| React | 18.3.1 | Locked |
| TypeScript | 5.8.3 | Locked |
| Supabase JS | 2.89.0 | Locked |
| TanStack Query | 5.83.0 | Locked |
| Recharts | 2.15.4 | Locked |
| shadcn/ui + Tailwind | 3.4.17 | Locked |
| Logto | 4.2.9 | Locked — managed separately |

This research covers only the **new** libraries required for the business logic milestone.

---

## New Libraries to Add

### 1. Pay Gap Calculation: `simple-statistics`

**Recommendation:** `simple-statistics` v7.8.8

**Why:** The EU directive (2023/970) requires reporting the unadjusted gender pay gap (mean and median salary differences by gender) and pay band quartile distributions (proportion of men/women in each salary quartile). `simple-statistics` provides all required primitives — `mean()`, `median()`, `quantile()`, `standardDeviation()` — with zero dependencies, < 30KB, works identically in Node.js and the browser, and is TypeScript-typed.

**Why not a specialized pay-gap library:** No mature, EU-directive-specific JavaScript pay gap library exists as of March 2026. The methodology is not complex mathematically — it is mean/median/quartile arithmetic plus percentage difference. A specialized library would be premature dependency.

**Why not full regression for the adjusted gap:** The adjusted pay gap (controlling for job level, tenure, experience) requires OLS regression or Blinder-Oaxaca decomposition. These are complex to implement correctly and the EU directive's primary actionable threshold is the **unadjusted gap > 5%** within equal-value job categories. Adjusted gap analysis is a v2 feature. If needed later, add `ml-regression` (npm) or `jstat` for OLS. Do not add these now.

**Confidence:** HIGH — verified against npm registry, library docs at simple-statistics.github.io, and EU directive requirements at eur-lex.europa.eu.

```bash
npm install simple-statistics
npm install -D @types/simple-statistics
```

**What to implement in-app (no library needed):**

```typescript
// Unadjusted pay gap = (male median - female median) / male median * 100
function unadjustedPayGap(maleSalaries: number[], femaleSalaries: number[]): number {
  const maleMed = median(maleSalaries)
  const femaleMed = median(femaleSalaries)
  return ((maleMed - femaleMed) / maleMed) * 100
}

// Quartile distribution: split all employees by salary quartile, count M/F in each
// Uses quantile(sortedSalaries, [0.25, 0.5, 0.75]) from simple-statistics
```

---

### 2. PDF Report Generation: `@react-pdf/renderer`

**Recommendation:** `@react-pdf/renderer` v4.3.2

**Why:** Compliance reports must be generated server-side in a Next.js Route Handler (not client-side) for two reasons: (1) the data is sensitive — salary data should not traverse the client bundle; (2) server-side generation ensures reproducibility and audit trail integrity. `@react-pdf/renderer` is the only React-ecosystem PDF library with reliable, documented server-side support via `renderToStream()`. It renders declarative JSX components to PDF without a headless browser.

**Why not Puppeteer:** Puppeteer ships a full Chromium binary (~300MB). This causes deployment issues on constrained environments (Coolify on a single VPS). Puppeteer also introduces timeout risks for complex reports. The Coolify deployment environment does not accommodate this.

**Why not jsPDF + jspdf-autotable:** jsPDF is primarily a client-side library. Table generation requires manual Y-position tracking (a pointer variable per row), which is unmaintainable for compliance reports with dynamic data. It has no native streaming for server responses.

**Why not pdfmake:** pdfmake has undocumented server-side errors in Next.js (confirmed in 2025 comparisons). Font path configuration on the server adds setup friction.

**Confidence:** MEDIUM-HIGH — confirmed server-side support in Next.js 15 via multiple 2024-2025 sources. v4.1.0+ explicitly supports React 19 (the next React upgrade path). Version 4.3.2 confirmed via npm.

**Important caveat:** `@react-pdf/renderer` uses its own layout engine (Yoga/Flexbox), not HTML/CSS. PDF components (`<Document>`, `<Page>`, `<View>`, `<Text>`) are separate from React DOM. Tailwind classes do not apply inside PDFs — use the library's `StyleSheet.create()` API.

```bash
npm install @react-pdf/renderer
```

**Usage pattern (Route Handler):**

```typescript
// app/api/reports/pay-gap/route.ts
import { renderToStream } from '@react-pdf/renderer'
import { PayGapReport } from '@/components/reports/PayGapReport'

export async function GET(req: Request) {
  const stream = await renderToStream(<PayGapReport data={reportData} />)
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="pay-gap-report.pdf"',
    },
  })
}
```

**Next.js config required** — mark the package as server-only to prevent client bundle inclusion:

```typescript
// next.config.ts
serverExternalPackages: ['@react-pdf/renderer']
```

---

### 3. CSV Export: No Additional Library — Use Native Node.js

**Recommendation:** No new library. Implement CSV serialization inline in Route Handlers using the `Response` API with a streaming `ReadableStream`.

**Why not papaparse:** papaparse's primary strength is CSV *parsing* (reading user-uploaded files). For *generating* CSV output from in-memory objects (the use case here: exporting pay gap data), it adds ~45KB for functionality achievable in 15 lines of TypeScript.

**Why not fast-csv:** fast-csv is well-suited for large file processing with stream transforms. The CSV exports here are compliance report datasets (hundreds to low thousands of rows) — no streaming infrastructure needed.

**Implementation pattern:**

```typescript
// app/api/reports/pay-gap/csv/route.ts
export async function GET() {
  const rows = await fetchPayGapData() // typed array from Supabase
  const headers = ['employee_id', 'department', 'gender', 'salary', 'pay_band']
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="pay-gap-export.csv"',
    },
  })
}
```

**Confidence:** HIGH — native approach, no external dependency risk.

---

### 4. Supabase RLS With Logto JWT — Pattern (No New Library)

**Recommendation:** JWT exchange pattern via a thin Supabase Edge Function or Next.js Route Handler middleware. No new npm library needed on the app side.

**Context:** Logto is a standard OIDC provider issuing asymmetrically-signed JWTs. Supabase's third-party auth officially supports Clerk, Firebase, Auth0, Cognito, and WorkOS — **not Logto directly**. This means Logto JWTs cannot be handed to Supabase as first-class third-party tokens.

**The required pattern:**

1. Logto issues a JWT to the user's browser on sign-in. The JWT contains `sub` (user id) and optionally `organization_id` as a custom claim (Logto supports custom JWT claims via its admin API).
2. A Next.js Route Handler (or Supabase Edge Function) acts as a token exchange endpoint: it validates the Logto JWT using Logto's JWKS endpoint, then mints a new JWT signed with the Supabase project JWT secret, embedding `sub`, `role: "authenticated"`, and `organization_id`.
3. The client uses this exchanged token when initializing the Supabase JS client: `createClient(url, anon_key, { accessToken: async () => exchangedToken })`.
4. RLS policies read claims via `auth.jwt()`:

```sql
-- Tenant isolation policy
create policy "tenant_isolation" on employees
  for all to authenticated
  using (organization_id = (auth.jwt() ->> 'organization_id'));

-- Role-based access
create policy "hr_manager_only" on pay_bands
  for insert to authenticated
  using ((auth.jwt() ->> 'user_role') in ('admin', 'hr_manager'));
```

**What Logto must configure:** Logto's custom JWT claims feature (available in Logto OSS and Cloud) must inject `organization_id` and `user_role` into its access tokens. This is done in Logto's admin console under "JWT claims" — a JavaScript snippet that adds claims from the user's metadata. This is outside the scope of this codebase (user manages Logto separately) but must be coordinated.

**Key function in RLS policies:**

| Function | Returns | Use |
|----------|---------|-----|
| `auth.jwt()` | Full JWT payload as JSONB | Read any custom claim |
| `auth.jwt() ->> 'organization_id'` | TEXT | Tenant isolation |
| `auth.jwt() ->> 'user_role'` | TEXT | RBAC checks |
| `auth.uid()` | UUID | Only for Supabase Auth users — NOT for Logto |

**Do not use `auth.uid()`** — this function only works with Supabase Auth's own user records. With a third-party JWT, `auth.uid()` may return null. Use `auth.jwt() ->> 'sub'` for user identity.

**Confidence:** MEDIUM — The exchange pattern is confirmed by Supabase docs (third-party auth page), the Authgear integration guide, and the Logto Supabase quickstart. The exact Logto custom claims configuration was not directly verified in official Logto docs (accessed docs.logto.io but no full custom claims RLS example was found). Flag for validation during RLS phase.

---

### 5. Data Import (CSV Upload): `papaparse`

**Recommendation:** `papaparse` v5.x for HR manager CSV uploads (employee data import).

**Why this is different from CSV export:** Parsing a user-uploaded CSV file is the genuine papaparse use case. It handles encoding edge cases, malformed rows, BOM characters, and delimiter detection that a hand-rolled parser will miss. HR managers uploading salary data will provide messy CSVs from payroll software.

**Why papaparse over alternatives:** It is the standard browser CSV parser in the JavaScript ecosystem. `react-papaparse` (the React wrapper) adds unnecessary indirection — use `papaparse` directly with a file input `onChange` handler.

**Confidence:** HIGH — papaparse is the de-facto standard for browser CSV parsing, well-documented, actively maintained.

```bash
npm install papaparse
npm install -D @types/papaparse
```

---

## Libraries to Remove (Not Add)

| Package | Reason to Remove |
|---------|-----------------|
| `@google/generative-ai` | AI features removed from scope (PROJECT.md). Dead dependency increasing bundle and attack surface. |
| `svix` | Was for Clerk webhook verification. Clerk is gone, Logto does not use Svix. Dead dependency. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| PDF generation | `@react-pdf/renderer` v4.3.2 | Puppeteer | ~300MB Chromium binary, timeout risks on VPS, overkill for tabular reports |
| PDF generation | `@react-pdf/renderer` v4.3.2 | pdfmake | Undocumented server-side failures in Next.js (2025), font path friction |
| PDF generation | `@react-pdf/renderer` v4.3.2 | jsPDF + autotable | Client-side primary, manual Y-tracking for tables, unmaintainable |
| Statistics | `simple-statistics` v7.8.8 | jstat | 5x larger bundle, R-style API overkill for median/quartile operations |
| Statistics | `simple-statistics` v7.8.8 | ml-regression | Needed only if adjusted gap (OLS regression) is in scope — it is not for v1 |
| CSV export | Native Response API | papaparse | papaparse's strength is parsing (reading), not serialization |
| CSV import | papaparse | fast-csv | fast-csv is a Node.js streaming library; browser file input requires browser API |
| RLS auth | JWT exchange pattern | Supabase third-party auth | Logto is not in Supabase's official supported providers list |

---

## Complete Installation Commands

```bash
# New production dependencies
npm install simple-statistics @react-pdf/renderer papaparse

# Type definitions for untyped packages
npm install -D @types/simple-statistics @types/papaparse

# Remove dead dependencies
npm uninstall @google/generative-ai svix
```

---

## next.config.ts Changes Required

```typescript
// next.config.ts — add to the config object
const nextConfig = {
  // ... existing config
  serverExternalPackages: ['@react-pdf/renderer'],
  // This prevents @react-pdf/renderer from being bundled client-side
}
```

---

## Sources

- EU Pay Transparency Directive 2023/970: https://eur-lex.europa.eu/eli/dir/2023/970/oj/eng
- Adjusted pay gap methodology and 5% threshold: https://www.paygap.com/articles/regression-analysis-and-adjusted-pay-gaps-in-pay-equity-audits-an-eu-pay-transparency-guide
- simple-statistics docs: https://simple-statistics.github.io/docs/
- @react-pdf/renderer comparison (2025): https://dmitriiboikov.com/posts/2025/01/pdf-generation-comarison/
- @react-pdf/renderer npm: https://www.npmjs.com/package/@react-pdf/renderer (v4.3.2, React 19 support since v4.1.0)
- Supabase third-party auth: https://supabase.com/docs/guides/auth/third-party/overview
- Supabase RLS custom claims: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
- JWT exchange pattern for any IdP: https://www.authgear.com/post/supabase-any-auth-provider
- Logto + Supabase integration: https://docs.logto.io/quick-starts/supabase
- papaparse: https://www.papaparse.com/

---

*Researched: 2026-03-19*
