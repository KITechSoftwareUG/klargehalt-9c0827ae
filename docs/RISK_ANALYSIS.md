# Risikoanalyse – Worst-Case-Szenarien

## Inhaltsverzeichnis
1. [Szenario 1: Mitarbeiter klagt](#szenario-1-mitarbeiter-klagt)
2. [Szenario 2: Datenleck](#szenario-2-datenleck)
3. [Szenario 3: Fehlberechnung](#szenario-3-fehlberechnung)
4. [Szenario 4: Behördenprüfung](#szenario-4-behördenprüfung)
5. [Risikomatrix](#risikomatrix)
6. [Präventionsmaßnahmen](#präventionsmaßnahmen)

---

## Szenario 1: Mitarbeiter klagt

### 1.1 Risikobeschreibung

```
┌─────────────────────────────────────────────────────────────┐
│              SZENARIO: MITARBEITERKLAGE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Auslöser:                                                  │
│  ├── Mitarbeiter erhält Gehaltsauskunft                     │
│  ├── Stellt Ungleichbehandlung fest                         │
│  ├── Fordert Nachzahlung + Schadensersatz                   │
│  └── Reicht Klage beim Arbeitsgericht ein                   │
│                                                             │
│  Ansprüche (§§ 7-10 EntgTranspG, Art. 4 RL 2023/970):       │
│  ├── Entgeltdifferenz (bis zu 3 Jahre rückwirkend)          │
│  ├── Schadensersatz                                         │
│  ├── Entschädigung (immaterieller Schaden)                  │
│  └── Prozesskosten                                          │
│                                                             │
│  Maximales Risiko pro Fall:                                 │
│  └── 50.000 - 200.000 EUR (je nach Gehaltsniveau)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Risikoanalyse

| Risikofaktor | Eintrittswahrsch. | Schadenshöhe | Risikostufe |
|--------------|-------------------|--------------|-------------|
| Einzelklage | Mittel (30%) | 50-200k EUR | HOCH |
| Sammelklage | Niedrig (5%) | 1-10 Mio EUR | KRITISCH |
| Reputationsschaden | Mittel (40%) | Schwer bezifferbar | HOCH |
| Präzedenzwirkung | Mittel (25%) | Folgeklagen | HOCH |

### 1.3 Technische Gegenmaßnahmen

```typescript
// 1. LÜCKENLOSE AUDIT-TRAIL
// Jede Datenänderung wird mit Hash-Chain gesichert

const AUDIT_REQUIREMENTS = {
  // Alle Gehaltsänderungen protokollieren
  salary_changes: {
    old_value: 'encrypted',
    new_value: 'encrypted',
    changed_by: 'user_id',
    changed_at: 'timestamp',
    reason: 'required',
    approval: 'required_for_changes > 5%',
  },
  
  // Alle Auskunftsanfragen dokumentieren
  info_requests: {
    request_type: 'enum',
    requested_at: 'timestamp',
    processed_at: 'timestamp',
    response_hash: 'sha256',
    response_version: 'integer',
  },
  
  // Systemzustand zum Zeitpunkt der Auskunft
  system_snapshot: {
    pay_band_version: 'version_id',
    job_profile_version: 'version_id',
    calculation_algorithm: 'version_hash',
  },
};

// 2. VERSIONIERTE BERECHNUNGEN
// Alle Berechnungslogik ist versioniert und reproduzierbar

const CALCULATION_VERSIONING = {
  // Jede Berechnung speichert die verwendete Version
  calculation_record: {
    algorithm_version: 'v2.1.3',
    input_data_hash: 'sha256',
    output_data_hash: 'sha256',
    calculated_at: 'timestamp',
  },
  
  // Alte Algorithmen bleiben verfügbar
  historical_algorithms: {
    retention: '10 years',
    reproducibility: 'guaranteed',
  },
};
```

### 1.4 Organisatorische Gegenmaßnahmen

| Maßnahme | Verantwortlich | Frequenz | Dokumentation |
|----------|----------------|----------|---------------|
| Entgeltstruktur-Review | HR + Betriebsrat | Jährlich | Protokoll |
| Pay-Equity-Analyse | HR | Halbjährlich | Bericht |
| Stichproben-Audit | Controlling | Quartalsweise | Bericht |
| Rechtsberatung Arbeitsrecht | Legal | Bei Bedarf | Gutachten |
| Führungskräfte-Schulung | HR | Jährlich | Teilnahmenachweis |

### 1.5 Beweisstrategie

```
┌─────────────────────────────────────────────────────────────┐
│              BEWEISSTRATEGIE BEI MITARBEITERKLAGE           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: Sofortmaßnahmen (Tag 1)                          │
│  ├── Audit-Log-Export des betroffenen Zeitraums            │
│  ├── Chain-Verifizierung durchführen                        │
│  ├── Systemzustand-Snapshot erstellen                       │
│  └── Dokumentenzugriff einfrieren (Legal Hold)              │
│                                                             │
│  Phase 2: Beweissicherung (Tag 1-3)                        │
│  ├── Alle Gehaltsänderungen des Klägers exportieren         │
│  ├── Alle Auskunftsanfragen + Antworten sichern             │
│  ├── Vergleichsgruppe anonymisiert aufbereiten              │
│  └── Systemkonfiguration zum Klagezeitpunkt                 │
│                                                             │
│  Phase 3: Analyse (Tag 3-14)                               │
│  ├── Sachliche Gründe für Gehaltsdifferenz prüfen           │
│  │   ├── Berufserfahrung                                    │
│  │   ├── Qualifikationen                                    │
│  │   ├── Leistungsbeurteilungen                             │
│  │   └── Betriebszugehörigkeit                              │
│  ├── Berechnung nachvollziehen                              │
│  └── Gutachten erstellen lassen                             │
│                                                             │
│  Phase 4: Prozessvorbereitung                              │
│  ├── Beweismittelverzeichnis erstellen                      │
│  ├── Zeugen identifizieren                                  │
│  └── Vergleichsangebot prüfen                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.6 Beweismittel aus dem System

| Beweismittel | Quelle | Beweiskraft | Exportformat |
|--------------|--------|-------------|--------------|
| Gehaltshistorie | `salary_info` + Audit | Hoch | JSON + PDF |
| Eingruppierungshistorie | `employee_assignments` | Hoch | JSON + PDF |
| Entgeltband zum Zeitpunkt X | `pay_band_versions` | Hoch | JSON + PDF |
| Auskunftsanfrage + Antwort | `employee_info_requests` | Hoch | JSON + PDF |
| Audit-Chain-Verifizierung | `verify_audit_chain()` | Sehr hoch | JSON + PDF |
| Systemkonfiguration | `data_change_history` | Hoch | JSON |

---

## Szenario 2: Datenleck

### 2.1 Risikobeschreibung

```
┌─────────────────────────────────────────────────────────────┐
│                   SZENARIO: DATENLECK                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Szenarien:                                                 │
│  ├── A: Unbefugter Zugriff (Hacking)                        │
│  ├── B: Insider-Bedrohung (Mitarbeiter)                     │
│  ├── C: Fehlkonfiguration (öffentlich zugänglich)           │
│  └── D: Phishing/Social Engineering                         │
│                                                             │
│  Betroffene Daten (Sensibilität):                          │
│  ├── Gehaltsdaten ████████████████████ KRITISCH             │
│  ├── Personaldaten ███████████████████ KRITISCH             │
│  ├── Geschlecht/Demografie ██████████ HOCH                  │
│  └── Unternehmensstrukturen █████████ MITTEL                │
│                                                             │
│  Maximales Risiko:                                          │
│  ├── DSGVO-Bußgeld: bis 4% Jahresumsatz / 20 Mio EUR        │
│  ├── Schadensersatz: pro Betroffener 1.000-5.000 EUR        │
│  ├── Reputationsschaden: Unternehmenswert -10-30%           │
│  └── Geschäftsverlust: Kundenabwanderung                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Risikoanalyse

| Szenario | Eintrittswahrsch. | Schadenshöhe | Risikostufe |
|----------|-------------------|--------------|-------------|
| Externer Angriff | Mittel (20%) | 500k-10 Mio EUR | KRITISCH |
| Insider-Bedrohung | Niedrig (10%) | 100k-2 Mio EUR | HOCH |
| Fehlkonfiguration | Mittel (15%) | 50k-500k EUR | HOCH |
| Phishing | Hoch (40%) | 10k-100k EUR | MITTEL |

### 2.3 Technische Gegenmaßnahmen

```sql
-- 1. DEFENSE IN DEPTH - Mehrschichtige Sicherheit

-- RLS auf allen sensitiven Tabellen (bereits implementiert)
-- Beispiel: salary_info ist nur für autorisierte Rollen sichtbar

-- 2. VERSCHLÜSSELUNG
-- At-rest: AES-256 (Datenbank-Ebene)
-- In-transit: TLS 1.3
-- Application-level: Gehaltsdaten zusätzlich verschlüsselt

-- 3. ZUGRIFFSKONTROLLE
-- Minimale Rechte pro Rolle
SELECT role, array_agg(permission_code) as permissions
FROM role_permissions
GROUP BY role;

-- 4. ANOMALIE-ERKENNUNG
-- Ungewöhnliche Zugriffsmuster erkennen
CREATE OR REPLACE FUNCTION detect_anomalous_access()
RETURNS TABLE(user_id uuid, action_count int, alert_level text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    user_id,
    COUNT(*) as action_count,
    CASE 
      WHEN COUNT(*) > 100 THEN 'CRITICAL'
      WHEN COUNT(*) > 50 THEN 'HIGH'
      WHEN COUNT(*) > 20 THEN 'MEDIUM'
      ELSE 'LOW'
    END as alert_level
  FROM audit_logs
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY user_id
  HAVING COUNT(*) > 20
$$;
```

```typescript
// 5. DATA LOSS PREVENTION (DLP)
const DLP_RULES = {
  // Bulk-Export verhindern
  max_records_per_export: 100,
  
  // Sensible Felder maskieren
  masked_fields: [
    'base_salary_encrypted',
    'total_compensation_encrypted',
    'birth_date',
    'tax_id',
  ],
  
  // Export-Audit
  export_requires_approval: true,
  export_logged: true,
  
  // Wasserzeichen in Exporten
  watermark: {
    enabled: true,
    includes: ['user_id', 'timestamp', 'company_id'],
  },
};

// 6. SESSION-SICHERHEIT
const SESSION_SECURITY = {
  max_session_duration: '8 hours',
  idle_timeout: '30 minutes',
  concurrent_sessions: 3,
  bind_to_ip: true,
  require_mfa_for_sensitive: true,
};
```

### 2.4 Organisatorische Gegenmaßnahmen

| Maßnahme | Verantwortlich | Frequenz | Dokumentation |
|----------|----------------|----------|---------------|
| Security Awareness Training | IT-Security | Quartalsweise | Teilnahmenachweis |
| Penetration Test | Externer Dienstleister | Jährlich | Bericht |
| Vulnerability Scan | IT-Security | Wöchentlich | Automatisiert |
| Access Review | IT-Security | Quartalsweise | Bericht |
| Incident Response Drill | IT-Security | Halbjährlich | Protokoll |
| Phishing-Simulation | IT-Security | Monatlich | Bericht |

### 2.5 Beweisstrategie bei Datenleck

```
┌─────────────────────────────────────────────────────────────┐
│              BEWEISSTRATEGIE BEI DATENLECK                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: Erkennung & Eindämmung (0-4h)                    │
│  ├── Incident-Detection-Log sichern                         │
│  ├── Betroffene Systeme isolieren                           │
│  ├── Forensic Image erstellen                               │
│  └── Incident Commander benennen                            │
│                                                             │
│  Phase 2: Beweissicherung (4-24h)                          │
│  ├── Audit-Logs exportieren (vor Manipulation)              │
│  ├── Netzwerk-Logs sichern                                  │
│  ├── Access-Logs sichern                                    │
│  ├── Zeitstempel verifizieren                               │
│  └── Chain of Custody dokumentieren                         │
│                                                             │
│  Phase 3: Analyse (24-72h)                                 │
│  ├── Umfang des Lecks bestimmen                             │
│  │   ├── Welche Daten?                                      │
│  │   ├── Welche Zeitraum?                                   │
│  │   └── Wie viele Betroffene?                              │
│  ├── Angriffsvektor identifizieren                          │
│  ├── Timeline erstellen                                     │
│  └── Externe Forensik einschalten                           │
│                                                             │
│  Phase 4: Meldepflichten (max. 72h)                        │
│  ├── Aufsichtsbehörde informieren                           │
│  ├── Betroffene benachrichtigen (wenn hohes Risiko)         │
│  └── Dokumentation für Behörde vorbereiten                  │
│                                                             │
│  Phase 5: Nachweis der Compliance                          │
│  ├── TOM-Dokumentation vorlegen                             │
│  ├── Sicherheitsmaßnahmen nachweisen                        │
│  ├── Schnelle Reaktion belegen                              │
│  └── Lessons Learned dokumentieren                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.6 Beweismittel

| Beweismittel | Zweck | Aufbewahrung |
|--------------|-------|--------------|
| Forensic Image | Systemzustand zum Zeitpunkt des Vorfalls | 10 Jahre |
| Audit-Logs | Nachweis der Zugriffe | 10 Jahre |
| Netzwerk-Logs | Angriffsvektor-Analyse | 1 Jahr |
| TOM-Dokumentation | Nachweis der Sorgfaltspflicht | Aktuell + Historisch |
| Incident-Response-Protokoll | Nachweis der schnellen Reaktion | 10 Jahre |
| Meldung an Aufsichtsbehörde | Nachweis der Compliance | 10 Jahre |

---

## Szenario 3: Fehlberechnung

### 3.1 Risikobeschreibung

```
┌─────────────────────────────────────────────────────────────┐
│              SZENARIO: FEHLBERECHNUNG                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Fehlertypen:                                               │
│  ├── A: Algorithmischer Fehler (Programmfehler)             │
│  ├── B: Datenfehler (falsche Eingabe)                       │
│  ├── C: Konfigurationsfehler (falsche Parameter)            │
│  └── D: Interpretationsfehler (rechtliche Auslegung)        │
│                                                             │
│  Auswirkungen:                                              │
│  ├── Falsche Gehaltsauskunft an Mitarbeiter                 │
│  ├── Falsche Pay-Gap-Berechnung                             │
│  ├── Fehlerhafte Eingruppierung                             │
│  └── Falsche Compliance-Berichte                            │
│                                                             │
│  Risiken:                                                   │
│  ├── Rechtsstreit (falsche Informationen)                   │
│  ├── Bußgeld (fehlerhafte Berichterstattung)                │
│  ├── Vertrauensverlust (Mitarbeiter + Kunden)               │
│  └── Nacharbeit (Korrekturen, Neuberechnungen)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Risikoanalyse

| Fehlertyp | Eintrittswahrsch. | Schadenshöhe | Risikostufe |
|-----------|-------------------|--------------|-------------|
| Algorithmischer Fehler | Niedrig (5%) | Hoch | MITTEL |
| Datenfehler | Hoch (40%) | Mittel | HOCH |
| Konfigurationsfehler | Mittel (20%) | Mittel | MITTEL |
| Interpretationsfehler | Mittel (25%) | Hoch | HOCH |

### 3.3 Technische Gegenmaßnahmen

```typescript
// 1. VERSIONIERTE ALGORITHMEN
const ALGORITHM_VERSIONING = {
  // Jeder Algorithmus hat eine Version
  pay_gap_calculation: {
    version: '2.1.0',
    hash: 'sha256:abc123...',
    valid_from: '2024-01-01',
    valid_until: null,
    test_coverage: '95%',
    audit_status: 'approved',
  },
  
  // Berechnung speichert verwendete Version
  calculation_record: {
    algorithm_id: 'pay_gap_calculation',
    algorithm_version: '2.1.0',
    input_hash: 'sha256:...',
    output_hash: 'sha256:...',
    calculated_at: 'timestamp',
  },
};

// 2. INPUT-VALIDIERUNG
const INPUT_VALIDATION = {
  salary: {
    type: 'number',
    min: 0,
    max: 10_000_000,
    required: true,
  },
  gender: {
    type: 'enum',
    values: ['male', 'female', 'diverse', 'not_specified'],
    required: true,
  },
  job_level: {
    type: 'enum',
    values: ['junior', 'mid', 'senior', 'lead', 'principal', 'director'],
    required: true,
  },
};

// 3. PLAUSIBILITÄTSPRÜFUNGEN
const PLAUSIBILITY_CHECKS = {
  salary_change: {
    max_increase_percent: 50, // Warnung bei > 50% Erhöhung
    max_decrease_percent: 20, // Warnung bei > 20% Senkung
  },
  pay_gap: {
    max_gap_percent: 50, // Warnung bei > 50% Gap
    min_group_size: 5,   // Keine Berechnung unter 5 Personen
  },
  age_validation: {
    min_working_age: 14,
    max_age: 100,
  },
};

// 4. DUAL-CONTROL-PRINZIP
const DUAL_CONTROL = {
  // Kritische Änderungen erfordern 4-Augen-Prinzip
  requires_approval: [
    'pay_band_version_create',
    'job_profile_version_create',
    'salary_change > 10%',
    'bulk_import',
  ],
  
  // Selbst-Genehmigung verboten
  self_approval: false,
};
```

```sql
-- 5. AUTOMATISCHE KONSISTENZPRÜFUNGEN
CREATE OR REPLACE FUNCTION check_data_consistency()
RETURNS TABLE(
  check_name text,
  status text,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check 1: Mitarbeiter ohne Gehaltsinformation
  RETURN QUERY
  SELECT 
    'employees_without_salary'::text,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END,
    jsonb_build_object('count', COUNT(*))
  FROM employees e
  LEFT JOIN salary_info s ON e.id = s.employee_id
  WHERE s.id IS NULL AND e.is_active = true;
  
  -- Check 2: Gehälter außerhalb der Entgeltbänder
  RETURN QUERY
  SELECT 
    'salaries_outside_bands'::text,
    CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END,
    jsonb_build_object('count', COUNT(*))
  FROM employees e
  JOIN salary_info s ON e.id = s.employee_id
  JOIN employee_assignments ea ON e.id = ea.employee_id
  JOIN pay_band_versions pbv ON ea.pay_band_version_id = pbv.id
  WHERE s.valid_until IS NULL
    AND ea.effective_until IS NULL
    AND (
      -- Salary comparison would go here
      -- (requires decryption logic)
      false
    );
  
  -- Check 3: Audit-Chain-Integrität
  RETURN QUERY
  SELECT 
    'audit_chain_integrity'::text,
    CASE WHEN is_valid THEN 'OK' ELSE 'CRITICAL' END,
    jsonb_build_object('checked_records', checked_records)
  FROM verify_audit_chain(
    (SELECT id FROM companies LIMIT 1),
    NULL, NULL
  );
END;
$$;
```

### 3.4 Organisatorische Gegenmaßnahmen

| Maßnahme | Verantwortlich | Frequenz | Dokumentation |
|----------|----------------|----------|---------------|
| Algorithmus-Review | Tech Lead + Legal | Bei Änderung | Code Review |
| Unit-Tests für Berechnungen | Entwicklung | Kontinuierlich | Testbericht |
| Stichproben-Kontrolle | Controlling | Monatlich | Prüfprotokoll |
| Rechtliche Prüfung | Legal | Bei Änderung | Gutachten |
| Konsistenzprüfung | System | Täglich | Automatisiert |

### 3.5 Beweisstrategie bei Fehlberechnung

```
┌─────────────────────────────────────────────────────────────┐
│            BEWEISSTRATEGIE BEI FEHLBERECHNUNG               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: Fehlererkennung                                  │
│  ├── Wer hat den Fehler gemeldet?                           │
│  ├── Wann wurde der Fehler erkannt?                         │
│  ├── Welche Berechnungen sind betroffen?                    │
│  └── Wie viele Personen sind betroffen?                     │
│                                                             │
│  Phase 2: Ursachenanalyse                                  │
│  ├── Algorithmus-Version identifizieren                     │
│  ├── Input-Daten prüfen                                     │
│  ├── Konfiguration zum Zeitpunkt X prüfen                   │
│  └── Root Cause dokumentieren                               │
│                                                             │
│  Phase 3: Auswirkungsanalyse                               │
│  ├── Alle betroffenen Berechnungen identifizieren           │
│  ├── Differenzen berechnen (korrekt vs. fehlerhaft)         │
│  ├── Finanzielle Auswirkung beziffern                       │
│  └── Rechtliche Auswirkung bewerten                         │
│                                                             │
│  Phase 4: Korrektur                                        │
│  ├── Algorithmus korrigieren                                │
│  ├── Neuberechnung durchführen                              │
│  ├── Betroffene informieren                                 │
│  └── Korrekte Werte bereitstellen                           │
│                                                             │
│  Phase 5: Prävention                                       │
│  ├── Testfälle erweitern                                    │
│  ├── Review-Prozess verbessern                              │
│  └── Dokumentation aktualisieren                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.6 Beweismittel

| Beweismittel | Zweck | Quelle |
|--------------|-------|--------|
| Algorithmus-Versionshistorie | Nachweis der verwendeten Logik | Git + data_change_history |
| Input-Daten-Snapshot | Nachweis der Eingabedaten | Audit-Logs |
| Berechnungsprotokoll | Nachvollziehbarkeit | info_request_responses |
| Konfigurationshistorie | Parameternachweis | data_change_history |
| Testprotokolle | Nachweis der Sorgfalt | CI/CD-Logs |
| Korrektur-Dokumentation | Nachweis der Behebung | Audit-Logs |

---

## Szenario 4: Behördenprüfung

### 4.1 Risikobeschreibung

```
┌─────────────────────────────────────────────────────────────┐
│              SZENARIO: BEHÖRDENPRÜFUNG                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Prüfende Behörden:                                         │
│  ├── Datenschutzaufsichtsbehörde (DSGVO)                    │
│  ├── Antidiskriminierungsstelle (AGG)                       │
│  ├── Zoll / Finanzkontrolle Schwarzarbeit                   │
│  └── Betriebsprüfung (Finanzamt)                            │
│                                                             │
│  Prüfungsanlässe:                                           │
│  ├── Routineprüfung                                         │
│  ├── Beschwerde (Mitarbeiter, Betriebsrat)                  │
│  ├── Verdachtsprüfung                                       │
│  └── Sektorale Schwerpunktprüfung                           │
│                                                             │
│  Anforderungen EU-Richtlinie 2023/970:                      │
│  ├── Art. 6: Entgelttransparenz vor Beschäftigung           │
│  ├── Art. 7: Auskunftsrecht Beschäftigte                    │
│  ├── Art. 9: Berichterstattung (ab 100 MA)                  │
│  └── Art. 10: Gemeinsame Entgeltbewertung                   │
│                                                             │
│  Risiken bei Mängeln:                                       │
│  ├── Bußgeld (DSGVO: bis 4% Umsatz / 20 Mio EUR)            │
│  ├── Bußgeld (EntgTranspG: bis 500.000 EUR)                 │
│  ├── Auflagen / Anordnungen                                 │
│  └── Öffentliche Rüge / Reputationsschaden                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Risikoanalyse

| Prüfungsart | Eintrittswahrsch. | Schadenshöhe | Risikostufe |
|-------------|-------------------|--------------|-------------|
| DSGVO-Prüfung | Mittel (15%) | 50k-20 Mio EUR | KRITISCH |
| Entgelttransparenz-Prüfung | Mittel (20%) | 50k-500k EUR | HOCH |
| Beschwerde-getriebene Prüfung | Mittel (25%) | 10k-100k EUR | MITTEL |
| Routineprüfung | Niedrig (10%) | 5k-50k EUR | NIEDRIG |

### 4.3 Technische Gegenmaßnahmen

```typescript
// 1. COMPLIANCE-DASHBOARD FÜR PRÜFER
const AUDITOR_CAPABILITIES = {
  // Spezieller Auditor-Zugang mit Zeitbegrenzung
  access: {
    role: 'auditor',
    requires_approval: true,
    max_duration: '30 days',
    logged: true,
  },
  
  // Verfügbare Berichte
  reports: [
    'pay_gap_by_category',
    'pay_band_coverage',
    'info_request_statistics',
    'audit_log_summary',
    'data_change_history',
  ],
  
  // Export-Formate
  export_formats: ['pdf', 'json', 'csv'],
  
  // Wasserzeichen
  watermark: 'Auditor Export - [Name] - [Date]',
};

// 2. AUTOMATISCHE COMPLIANCE-REPORTS
const COMPLIANCE_REPORTS = {
  // EU-Richtlinie 2023/970 Art. 9
  annual_pay_gap_report: {
    frequency: 'yearly',
    deadline: 'March 31',
    content: [
      'pay_gap_by_gender',
      'pay_gap_by_job_category',
      'median_pay_gap',
      'bonus_gap',
      'proportion_by_quartile',
    ],
    format: 'pdf',
    signed: true,
  },
  
  // Interne Compliance-Prüfung
  quarterly_compliance_check: {
    frequency: 'quarterly',
    content: [
      'data_completeness',
      'audit_chain_integrity',
      'access_control_review',
      'info_request_statistics',
    ],
  },
};
```

```sql
-- 3. PRÜFER-SPEZIFISCHE FUNKTIONEN
CREATE OR REPLACE FUNCTION get_compliance_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Nur für Auditoren
  IF NOT has_role(auth.uid(), 'auditor') AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  SELECT jsonb_build_object(
    'total_employees', (SELECT COUNT(*) FROM employees WHERE is_active = true),
    'employees_with_salary_info', (
      SELECT COUNT(DISTINCT e.id) 
      FROM employees e 
      JOIN salary_info s ON e.id = s.employee_id 
      WHERE e.is_active = true AND s.valid_until IS NULL
    ),
    'job_profiles_active', (SELECT COUNT(*) FROM job_profiles WHERE is_active = true),
    'pay_bands_active', (SELECT COUNT(*) FROM pay_bands_normalized WHERE is_active = true),
    'info_requests_last_year', (
      SELECT COUNT(*) 
      FROM employee_info_requests 
      WHERE submitted_at > NOW() - INTERVAL '1 year'
    ),
    'audit_chain_valid', (
      SELECT is_valid 
      FROM verify_audit_chain(get_user_company_id(), NULL, NULL)
    ),
    'last_audit_export', (
      SELECT MAX(exported_at) 
      FROM audit_exports 
      WHERE company_id = get_user_company_id()
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 4. DATENEXPORT FÜR PRÜFER
CREATE OR REPLACE FUNCTION export_for_auditor(
  _date_from timestamp,
  _date_to timestamp,
  _export_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Nur für Auditoren mit aktivem Zugang
  IF NOT EXISTS (
    SELECT 1 FROM auditor_access 
    WHERE user_id = auth.uid() 
    AND is_revoked = false 
    AND valid_until > NOW()
  ) THEN
    RAISE EXCEPTION 'No active auditor access';
  END IF;
  
  -- Export durchführen und loggen
  -- (Implementation je nach Export-Typ)
  
  RETURN result;
END;
$$;
```

### 4.4 Organisatorische Gegenmaßnahmen

| Maßnahme | Verantwortlich | Frequenz | Dokumentation |
|----------|----------------|----------|---------------|
| Compliance-Self-Assessment | Compliance Officer | Quartalsweise | Checkliste |
| Mock-Audit | Externe Beratung | Jährlich | Bericht |
| Dokumentationsupdate | Legal | Bei Änderungen | Versioniert |
| Schulung Prüfungsablauf | HR + IT | Jährlich | Teilnahmenachweis |
| Prüfer-Kontaktliste aktuell | Geschäftsführung | Quartalsweise | Liste |

### 4.5 Beweisstrategie bei Behördenprüfung

```
┌─────────────────────────────────────────────────────────────┐
│            BEWEISSTRATEGIE BEI BEHÖRDENPRÜFUNG              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: Vorbereitung (vor Prüfung)                       │
│  ├── Compliance-Dokumentation aktuell halten               │
│  ├── Regelmäßige Self-Audits durchführen                   │
│  ├── Schnellzugriff auf Berichte vorbereiten               │
│  └── Ansprechpartner benennen                               │
│                                                             │
│  Phase 2: Prüfungsankündigung                              │
│  ├── Prüfungsumfang verstehen                               │
│  ├── Angeforderte Dokumente zusammenstellen                 │
│  ├── Interne Vorab-Prüfung                                  │
│  └── Rechtsbeistand informieren                             │
│                                                             │
│  Phase 3: Während der Prüfung                              │
│  ├── Kooperativ aber vorsichtig                             │
│  ├── Nur angeforderte Daten bereitstellen                   │
│  ├── Alle Anfragen dokumentieren                            │
│  ├── Prüfer-Zugang zeitlich begrenzen                       │
│  └── Protokoll führen                                       │
│                                                             │
│  Phase 4: Nach der Prüfung                                 │
│  ├── Prüfungsergebnis analysieren                           │
│  ├── Bei Mängeln: Maßnahmenplan erstellen                   │
│  ├── Fristen einhalten                                      │
│  └── Verbesserungen dokumentieren                           │
│                                                             │
│  Verfügbare Nachweise:                                     │
│  ├── Vollständige Audit-Logs (10 Jahre)                     │
│  ├── Versionierte Entgeltstrukturen                         │
│  ├── Dokumentierte Auskunftsprozesse                        │
│  ├── Anonymisierte Pay-Gap-Berichte                         │
│  ├── TOM-Dokumentation                                      │
│  └── Schulungsnachweise                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.6 Dokumentenmatrix für Prüfungen

| Prüfungsart | Erforderliche Dokumente | Quelle im System |
|-------------|------------------------|------------------|
| DSGVO | TOM, Verarbeitungsverzeichnis, AVV | docs/ |
| DSGVO | Löschkonzept, Betroffenenrechte-Prozess | docs/ |
| DSGVO | Audit-Logs, Zugriffsprotokolle | audit_logs, audit_exports |
| EntgTranspG | Pay-Gap-Berichte | generate_pay_equity_report() |
| EntgTranspG | Entgeltbänder mit Historie | pay_band_versions |
| EntgTranspG | Auskunftsstatistik | employee_info_requests |
| Allgemein | Berechtigungskonzept | role_permissions |
| Allgemein | Änderungshistorie | data_change_history |

---

## Risikomatrix

### Gesamtübersicht

```
                    SCHADENSHÖHE
                    Niedrig    Mittel     Hoch      Kritisch
                    (<50k)     (50-500k)  (500k-5M) (>5M)
                 ┌──────────┬──────────┬──────────┬──────────┐
    Hoch (>40%)  │          │ Phishing │          │          │
                 │          │          │          │          │
                 ├──────────┼──────────┼──────────┼──────────┤
E   Mittel       │ Routine- │ Konfig.- │ Einzel-  │ Externer │
I   (15-40%)     │ prüfung  │ Fehler   │ klage    │ Angriff  │
N                │          │          │          │          │
T   ├──────────┼──────────┼──────────┼──────────┤
R   Niedrig      │          │ Algo-    │ Insider  │ Sammel-  │
I   (5-15%)      │          │ Fehler   │ Bedroh.  │ klage    │
T                │          │          │          │          │
T   ├──────────┼──────────┼──────────┼──────────┤
S   Sehr niedrig │          │          │          │          │
W   (<5%)        │          │          │          │          │
.                │          │          │          │          │
                 └──────────┴──────────┴──────────┴──────────┘
                 
Legende:
█ KRITISCH - Sofortmaßnahmen erforderlich
█ HOCH - Aktive Überwachung + Gegenmaßnahmen
█ MITTEL - Regelmäßige Überprüfung
█ NIEDRIG - Standardprozesse ausreichend
```

### Priorisierte Maßnahmen

| Priorität | Risiko | Top-Maßnahme | Status |
|-----------|--------|--------------|--------|
| 1 | Sammelklage | Proaktive Pay-Equity-Analyse | ☐ |
| 2 | Externer Angriff | Penetration Test + Bug Bounty | ☐ |
| 3 | DSGVO-Prüfung | Vollständige TOM-Dokumentation | ☐ |
| 4 | Einzelklage | Lückenlose Audit-Trail | ✓ |
| 5 | Datenfehler | Dual-Control + Validierung | ✓ |

---

## Präventionsmaßnahmen

### Kontinuierliche Maßnahmen

| Maßnahme | Frequenz | Automatisiert |
|----------|----------|---------------|
| Audit-Chain-Verifizierung | Täglich | Ja |
| Konsistenzprüfung | Täglich | Ja |
| Backup-Verifizierung | Wöchentlich | Ja |
| Security-Scan | Wöchentlich | Ja |
| Access-Review | Monatlich | Nein |
| Pay-Equity-Analyse | Quartalsweise | Teilweise |
| Compliance-Self-Assessment | Quartalsweise | Nein |
| Penetration Test | Jährlich | Nein |
| Mock-Audit | Jährlich | Nein |

### Versicherungsempfehlung

| Versicherung | Deckung | Empfohlen |
|--------------|---------|-----------|
| Cyber-Versicherung | Datenleck, Angriffe | Ja |
| D&O-Versicherung | Managerhaftung | Ja |
| Berufshaftpflicht | Beratungsfehler | Ja |
| Rechtsschutz | Arbeitsrecht, Datenschutz | Ja |

---

## Anhang: Schnellreferenz

### Meldepflichten-Übersicht

| Ereignis | Frist | Empfänger | Intern |
|----------|-------|-----------|--------|
| Datenpanne (hohes Risiko) | 72h | Aufsichtsbehörde | Sofort |
| Datenpanne (Betroffene) | Unverzüglich | Betroffene | Sofort |
| Arbeitsrechtsstreit | - | Rechtsanwalt | Sofort |
| Behördenanfrage | lt. Bescheid | Behörde | Sofort |

### Notfall-Kontakte (Template)

```markdown
## Notfall-Kontakte (ausfüllen!)

| Rolle | Name | Telefon |
|-------|------|---------|
| Incident Commander | [Name] | [Telefon] |
| DSB | [Name] | [Telefon] |
| Rechtsanwalt Arbeitsrecht | [Kanzlei] | [Telefon] |
| Rechtsanwalt IT-Recht | [Kanzlei] | [Telefon] |
| IT-Forensik | [Dienstleister] | [Telefon] |
| Cyber-Versicherung | [Versicherer] | [Policen-Nr.] |
```
