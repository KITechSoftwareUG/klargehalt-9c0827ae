# Enterprise Systemarchitektur & Sicherheitskonzept: KlarGehalt SaaS

**Status:** Draft v1.0  
**Autor:** Senior System Architect (Antigravity AI)  
**Datum:** 20.02.2026

---

## 1. High-Level Architektur (Textuell)

Das System folgt dem **"Fortress Database"** Prinzip: Die Datenbank ist die letzte Bastion der Sicherheit. Selbst wenn das Frontend oder der API-Server kompromittiert würde, verhindert die Datenbank (RLS) unberechtigten Datenzugriff.

```mermaid
[Client (Browser)] 
    │ TLS 1.3 / HTTPS
    ▼
[Vercel Edge Network (WAF, DDoS Protection)]
    │
    ▼
[Next.js App Server (Server Actions / API Routes)]
    │ Authentifizierung via Clerk SDK
    │ Validierung der Session & Org-Rechte
    │ 
    ├── [Clerk Auth Service] (Identity Provider, MFA)
    │
    ▼
[Supabase (PostgreSQL)]
    │ Connection Pooling (Supavisor)
    │
    ├── [Data Layer] (Tabellen mit organization_id)
    │       ▲
    │       │ RLS Policies (Die Firewall vor den Daten)
    │       │ Prüft: Ist User in dieser Org? Hat User die Rolle?
    │       ▼
    ├── [Audit Layer] (Trigger-basiertes Logging aller Schreibzugriffe)
    │
    └── [Vault] (Verschlüsselte Speicherung sensibler Spalten via pgcrypto)

[AI Service Layer (Optional)]
    │ Nur anonymisierte Gehaltsdaten (keine Namen/IDs)
    ▼
[Google Gemini API (Enterprise Agreement - EU Data Residency)]
```

---

## 2. Datenbank-Modell (Isolation Strategy)

Jede Tabelle, die mandantenspezifische Daten enthält, **MUSS** eine `organization_id` besitzen. Keine Ausnahmen.

### Kern-Tabellen Struktur

```sql
-- 1. Organizations (Mandanten)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL UNIQUE, -- Clerk Org ID (Der Anker)
    legal_name TEXT NOT NULL,
    subscription_tier TEXT DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sensitive Data (Gehälter)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL, -- Zwingend für RLS
    company_id UUID REFERENCES companies(id), -- Relationaler Link
    
    -- PII (Personenbezogene Daten) - Encryption Candidate
    first_name TEXT, 
    last_name TEXT,
    
    -- Sensible Daten
    current_salary NUMERIC(12,2),
    
    -- Audit Metadaten
    created_by TEXT, -- User ID
    updated_at TIMESTAMPTZ
);

-- Indexing Strategie für Performance & Security
CREATE INDEX idx_employees_org_id ON employees(organization_id);
-- Ohne diesen Index werden RLS-Checks bei großen Datenmengen langsam!
```

---

## 3. Row-Level Security (RLS) - The Enterprise Way

Wir verlassen uns **nicht** darauf, dass das Frontend (Next.js) korrekt filtert (`.eq('org_id', id)`). Wir erzwingen es in der DB.

### Ansatz A: Hybrid (User Roles Tabelle)
*Aktueller Ansatz im Projekt. Solide, erfordert aber JOINs bei jedem Request.*

```sql
-- Helper Funktion um Code-Duplizierung zu vermeiden
CREATE OR REPLACE FUNCTION auth.get_user_org_id() 
RETURNS TEXT AS $$
    SELECT organization_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid()::text 
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Policy: Nur Daten der eigenen Org sehen
CREATE POLICY "Tenant Isolation Policy"
ON public.employees
FOR ALL -- Gilt für SELECT, INSERT, UPDATE, DELETE
USING (
    organization_id = auth.get_user_org_id()
);
```

### Ansatz B: JWT Custom Claims (Performance Pro-Tipp)
*Besser für Skalierung: Die Org-ID steckt direkt im Clerk-Token.*

```sql
-- Policy ohne DB-Lookup (extrem schnell)
CREATE POLICY "Tenant Isolation Policy JWT"
ON public.employees
USING (
    organization_id = (auth.jwt() ->> 'org_id')::text
);
```

**Empfehlung:** Bleiben Sie erst bei Ansatz A, aber cachen Sie die Permissions im Frontend.

---

## 4. Rollen & Rechte Matrix (RBAC)

Wir implementieren strikte Trennung nach "Least Privilege".

| Aktion | Admin (Owner) | HR Manager | Mitarbeiter | Auditor (Ext.) |
| :--- | :---: | :---: | :---: | :---: |
| **Org Settings** | ✅ Edit | 👁️ View | ❌ | 👁️ View |
| **Alle Gehälter sehen** | ✅ | ✅ | ❌ (Nur eigenes) | ✅ |
| **Gehälter bearbeiten** | ✅ | ✅ | ❌ | ❌ |
| **Struktur anlegen** | ✅ | ✅ | ❌ | ❌ |
| **Audit Logs sehen** | ✅ | ❌ | ❌ | ✅ |
| **User einladen** | ✅ | ❌ | ❌ | ❌ |
| **AI Analyse starten** | ✅ | ✅ | ❌ | ❌ |

---

## 5. Sicherheits-Checklist (Security Hardening)

### Application Level
- [ ] **Rate Limiting:** Auf allen API Routes via Vercel KV oder Upstash (z.B. 10 req/s pro IP).
- [ ] **Input Validation:** Zod für JEDEN API-Input. Keine rohen JSON-Daten verarbeiten.
- [ ] **Output Sanitization:** Keine internen IDs oder Stack Traces an den Client senden.

### Database Level
- [ ] **RLS Enabled:** Jede Tabelle muss `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` haben.
- [ ] **No Public Access:** `public` Schema usage für `anon` Rolle komplett verbieten, außer explizit gewollt.
- [ ] **PITR (Point-in-Time Recovery):** Bei Supabase aktivieren (ermöglicht Rollback auf jede Sekunde der letzten 7 Tage).

### Infrastructure
- [ ] **Environment Segregation:**
    - `Development`: Lokale Daten / Mock Daten.
    - `Staging`: Anonymisierte Prod-Daten.
    - `Production`: Echte Daten.
    - *Regel:* Niemals Prod-Daten auf Dev-Laptops kopieren!

---

## 6. Audit Logging (Audit Trail)

Die DSGVO verlangt zu wissen: "Wer hat wann die Gehaltsdaten von Herr Müller geändert?"

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'UPDATE', 'DELETE', 'VIEW_SENSITIVE'
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_data JSONB, -- Was stand vorher drin?
    new_data JSONB, -- Was steht jetzt drin?
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger Beispiel (verkürzt)
CREATE TRIGGER log_salary_changes
AFTER UPDATE OF current_salary ON employees
FOR EACH ROW EXECUTE FUNCTION supabase_functions.log_audit_event();
```

---

## 7. KI & Datenschutz (AI Safety)

Wenn wir Gehälter an eine KI senden:
1.  **Pseudonymisierung:** Ersetze "Max Mustermann" durch "Employee_A123".
2.  **Aggregation:** Sende keine Einzeldatensätze wenn möglich, sondern Gruppenstatistiken ("Level Senior Dev: Avg 85k").
3.  **Zero-Retention:** Konfiguriere die API so, dass Daten nicht zum Training verwendet werden (Enterprise Agreement notwendig).

**Verboten:**
- Senden von echten Namen, Adressen, Geburtsdaten an LLMs.

---

## 8. Typische Gründer-Fehler (Avoid these!)

1.  **"RLS mache ich später":** Tödlich. RLS muss ab Tag 1 aktiv sein. Nachträglich fast unmöglich sicher zu bekommen.
2.  **Frontend-Filtering:** `employees.filter(e => e.org === currentOrg)` im JavaScript ist KEINE Sicherheit. Ein Angreifer kann die API direkt aufrufen.
3.  **Mangelndes Backup-Testen:** Ein Backup, das nicht restored wurde, existiert nicht.
4.  **Admin als "Gott":** Auch Admins sollten Audit-Logs erzeugen. Insider-Bedrohungen sind real.
5.  **Secrets im Code:** `.env` Dateien nicht in Git committen (passiert oft versehentlich).

---

## 9. Incident Response Plan (Kurzfassung)

Bei Verdacht auf Datenleck:
1.  **Containment:** Supabase Projekt pausieren / API Keys widerrufen.
2.  **Analysis:** Audit Logs prüfen (Welche Org ID hat zugegriffen? Welche IPs?).
3.  **Notification:** Innerhalb 72h an Datenschutzbehörde melden (DSGVO), falls PII betroffen.
4.  **Remediation:** Patch einspielen, Keys rotieren.
5.  **Forensic:** Post-Mortem Analyse für Dokumentation.

---

## 10. Deployment & Stabilität

**Zero-Downtime Datenbank-Migrationen:**
- Niemals Spalten umbenennen (`RENAME COLUMN`) in Prod.
- Stattdessen:
  1. Neue Spalte hinzufügen.
  2. Code deployen, der beide schreibt.
  3. Daten migrieren.
  4. Alte Spalte löschen.

**Monitoring:**
- **Sentry:** Für Error Tracking (Backend & Frontend).
- **Supabase Dashboard:** Für Slow Query Logs.
- **Vercel Analytics:** Für Real User Monitoring (Ladezeiten).

---
