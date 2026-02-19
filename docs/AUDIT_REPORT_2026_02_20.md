### **SECURITY & ARCHITECTURE AUDIT REPORT: KLARGEHALT**
**Date:** 20.02.2026
**Auditor:** Senior Security Architect (Antigravity AI)
**Severity Level:** **CRITICAL** (Immediate Action Required)

---

### **Executive Summary**

The platform is currently in a state of **Critical Vulnerability** coupled with **Functional Failure**. 
While the architectural intent (isolate tenants via RLS) is correct, the implementation relies on a brittle dependency: The assumption that the `org_id` is present in the Clerk JWT Token claim.

**Current Finding:** The "Invalid API Key" / "Loading Error" loop is caused by the RLS policy `public.org_id()` returning `NULL`. This effectively locks *everyone* out of their own data, including Admins.

Worse, the proposed fix `RLS_FALLBACK_STRATEGY.sql`—while functionally restoring access—introduces a massive **Security Flaw** if not paired with strict session validation, because it trusts the database state (`user_roles`) which needs to be rigorously protected.

---

### **Technical Findings (The "Kill List")**

#### **1. 🚫 RLS Bypass & Auth Failure [CRITICAL]**
**Location:** Database Policies (RLS)
**Issue:** The current policy relies on `auth.jwt() ->> 'org_id'`. 
**Evidence:** The frontend errors "Fehler beim Laden..." confirm that `public.org_id()` evaluates to `NULL` (or incorrect value).
**Impact:** 
1.  **Denial of Service (Self-Inflicted):** Valid users cannot see their data.
2.  **Potential Leak:** If the Fallback Strategy is implemented naively (`OR organization_id IS NULL`), it might expose all tenant data as "public" data if the query is malformed.

**Recommended Fix:**
Adopt the **"Database Lookup" Strategy** (as drafted in `RLS_FALLBACK_STRATEGY.sql`), but harden it. Do NOT rely on JWT claims if you cannot guarantee their presence via Clerk Templates.

#### **2. 🔑 API Route Security [HIGH]**
**Location:** `app/api/pay-equity/update-stats/route.ts`
**Issue:**
```typescript
const { company_id } = body; // Trusted from client?
// ...
const { data: userRole } = await supabase
    .from('user_roles')
    // ...
    .eq('company_id', company_id) // Validates access, BUT...
```
**Risk:** The API trusts `company_id` from the body. While it *checks* permission, a cleaner approach is to derive the `company_id` *solely* from the user's authenticated context (e.g., via the Clerk Org ID), rather than letting the client send it.
**Fix:** Use `auth().orgId` from Clerk/NextJS server helpers as the *source of truth*, ignoring the client body for sensitive context.

#### **3. 💉 SQL Injection / Logic Bypass [MEDIUM]**
**Location:** `supabase/migrations/MASTER_RLS_FIX.sql`
**Issue:** The function `update_pay_group_stats` is called via RPC.
**Risk:** If `update_pay_group_stats` uses dynamic SQL (`EXECUTE 'SELECT...'`) internally, it could be vulnerable.
**Fix:** Ensure all PL/pgSQL functions use `Check constraints` or explicit variable binding (`$1, $2`) and avoid string concatenation.

#### **4. 📉 Business Logic Flaw (Permission Model) [HIGH]**
**Location:** `hooks/useAuth.tsx` & Data Sync
**Issue:** The onboarding flow creates a profile locally. 
```typescript
// Create profile if not exists (Client-side sync)
const newProfile = { ... }
await supabase.from('profiles').upsert(...)
```
**Risk:** A malicious user could call this `upsert` API directly with a manipulated `organization_id` to attach themselves to a different valid Org ID (ID Enumeration Attack).
**Fix:** The DB Policy for `profiles` INSERT/UPDATE must strictly enforce that `organization_id` matches the authenticated user's verified Clerk Org claim. You cannot trust the client to say "I belong to Org X".

---

### **IMMEDIATE ACTION PLAN (The Fix)**

To resolve the "still errors" AND secure the system:

1.  **EXECUTE THE FALLBACK STRATEGY (Functionality & Security Fix):**
    Run the SQL script `supabase/migrations/RLS_FALLBACK_STRATEGY.sql`.
    *Why?* It removes the broken dependence on the JWT claim (`auth.jwt() ->> 'org_id'`) and replaces it with a robust database lookup (`public.current_user_org_id()`). This will immediately fix the "Loading Errors".

2.  **HARDEN THE DB LOOKUP:**
    The fallback script looks up `user_roles`. Ensure `user_roles` is **Write-Protected** so only Admins via the backend can change it. (The script already includes policies for this).

3.  **VERIFY:**
    After running the script, reload the page. The data should appear.

---

**Auditor Sign-off:** 
*Waiting for execution of RLS_FALLBACK_STRATEGY.sql to confirm resolution of Critical Finding #1.*
