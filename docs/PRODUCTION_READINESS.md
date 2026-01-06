# Produktions-Bereitschaft – EntgeltTransparenz SaaS

## Inhaltsverzeichnis
1. [EU-Hosting & Compliance](#1-eu-hosting--compliance)
2. [Backup-Strategie](#2-backup-strategie)
3. [Logging & Monitoring](#3-logging--monitoring)
4. [Incident-Response](#4-incident-response)
5. [Deployment-Checkliste](#5-deployment-checkliste)
6. [Sicherheits-Checkliste](#6-sicherheits-checkliste)
7. [Go-Live-Kriterien](#7-go-live-kriterien)

---

## 1. EU-Hosting & Compliance

### 1.1 Rechenzentrum-Anforderungen

| Anforderung | Status | Nachweis |
|-------------|--------|----------|
| Standort in EU/EWR | ☐ | Vertrag mit RZ-Betreiber |
| ISO 27001 Zertifizierung | ☐ | Zertifikat vorlegen |
| SOC 2 Type II | ☐ | Audit-Report |
| DSGVO-konformer AVV | ☐ | Unterschriebener Vertrag |
| C5-Testat (optional, für Behörden) | ☐ | BSI-Bescheinigung |

### 1.2 Empfohlene EU-Hosting-Provider

```
Primär (Produktion):
├── Lovable Cloud (Supabase EU) – Frankfurt/Dublin
├── Hetzner Cloud – Nürnberg/Falkenstein
├── OVHcloud – Straßburg/Frankfurt
└── AWS eu-central-1 – Frankfurt

Sekundär (Failover):
├── Hetzner Cloud – Helsinki
├── Scaleway – Paris/Amsterdam
└── AWS eu-west-1 – Dublin
```

### 1.3 Datenresidenz-Konfiguration

```typescript
// Beispiel: Supabase/Lovable Cloud ist bereits EU-gehostet
// Zusätzliche Konfiguration für externe Services:

const EU_ONLY_CONFIG = {
  database: {
    region: 'eu-central-1',
    replication: ['eu-west-1'], // Nur EU-Regionen
    encryption: 'AES-256-GCM',
  },
  storage: {
    region: 'eu-central-1',
    crossRegionReplication: false, // Keine Replikation außerhalb EU
  },
  cdn: {
    allowedRegions: ['EU', 'EEA'],
    blockNonEU: true,
  },
  analytics: {
    provider: 'self-hosted', // Keine US-Analytics-Dienste
    dataRetention: '13 months', // DSGVO-konform
  }
};
```

### 1.4 Rechtliche Dokumentation

| Dokument | Verantwortlich | Frist |
|----------|----------------|-------|
| Datenschutzerklärung | DSB | Vor Go-Live |
| AGB / Nutzungsbedingungen | Rechtsabteilung | Vor Go-Live |
| Auftragsverarbeitungsvertrag (AVV) | Rechtsabteilung | Vor Go-Live |
| Technisch-organisatorische Maßnahmen (TOM) | IT-Sicherheit | Vor Go-Live |
| Verzeichnis der Verarbeitungstätigkeiten | DSB | Vor Go-Live |
| Cookie-Richtlinie | DSB | Vor Go-Live |

---

## 2. Backup-Strategie

### 2.1 Backup-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKUP-STRATEGIE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Echtzeit  │    │   Täglich   │    │  Wöchentlich│     │
│  │   WAL-Log   │    │  Snapshot   │    │  Full Backup│     │
│  │  Streaming  │    │   01:00 UTC │    │  Sonntag    │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Primäres Backup-Storage                │   │
│  │              (gleiches RZ, verschlüsselt)           │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            │                               │
│                            ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Geo-redundantes Backup-Storage            │   │
│  │           (anderes EU-RZ, verschlüsselt)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Backup-Konfiguration

| Backup-Typ | Frequenz | Aufbewahrung | Verschlüsselung |
|------------|----------|--------------|-----------------|
| WAL-Streaming | Kontinuierlich | 7 Tage | AES-256 |
| Täglicher Snapshot | 01:00 UTC | 30 Tage | AES-256 |
| Wöchentliches Full | Sonntag 02:00 UTC | 12 Wochen | AES-256 |
| Monatliches Archiv | 1. des Monats | 24 Monate | AES-256 |
| Jährliches Archiv | 1. Januar | 10 Jahre | AES-256 |

### 2.3 Recovery Point Objective (RPO) & Recovery Time Objective (RTO)

| Szenario | RPO | RTO | Methode |
|----------|-----|-----|---------|
| Datenbank-Korruption | 5 Minuten | 15 Minuten | Point-in-Time Recovery |
| Versehentliche Löschung | 0 Minuten | 30 Minuten | WAL Replay |
| Rechenzentrum-Ausfall | 1 Stunde | 4 Stunden | Geo-Failover |
| Ransomware-Angriff | 24 Stunden | 8 Stunden | Offline-Backup Restore |

### 2.4 Backup-Verifizierung

```sql
-- Monatlicher Backup-Test (manuell durchführen)
-- 1. Backup in Test-Umgebung wiederherstellen
-- 2. Integritätsprüfung durchführen:

SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- 3. Audit-Chain verifizieren:
SELECT * FROM verify_audit_chain(
  (SELECT id FROM companies LIMIT 1),
  NULL,
  NULL
);

-- 4. Ergebnis dokumentieren
```

---

## 3. Logging & Monitoring

### 3.1 Log-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                     LOG-PIPELINE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Quellen:                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Frontend │ │ Backend  │ │ Database │ │   Auth   │       │
│  │   Logs   │ │   Logs   │ │   Logs   │ │   Logs   │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│       ▼            ▼            ▼            ▼              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Log-Aggregation (Fluentd/Vector)       │   │
│  │              - Parsing & Enrichment                 │   │
│  │              - PII-Maskierung                       │   │
│  │              - Strukturierung                       │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                            │                               │
│       ┌────────────────────┼────────────────────┐          │
│       ▼                    ▼                    ▼          │
│  ┌──────────┐        ┌──────────┐        ┌──────────┐      │
│  │ Hot Logs │        │ Warm Logs│        │ Cold Logs│      │
│  │  7 Tage  │        │ 90 Tage  │        │  7 Jahre │      │
│  │(Echtzeit)│        │(Archiv)  │        │(Complianc│      │
│  └──────────┘        └──────────┘        └──────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Log-Kategorien und Aufbewahrung

| Log-Kategorie | Inhalt | Aufbewahrung | PII-Handling |
|---------------|--------|--------------|--------------|
| Security Logs | Login-Versuche, Auth-Fehler | 7 Jahre | IP pseudonymisiert |
| Audit Logs | Alle Datenänderungen | 10 Jahre | Vollständig |
| Application Logs | Fehler, Warnungen | 90 Tage | PII maskiert |
| Access Logs | HTTP-Requests | 30 Tage | IP pseudonymisiert |
| Performance Logs | Metriken, Traces | 14 Tage | Keine PII |

### 3.3 Monitoring-Dashboard

```typescript
// Empfohlene Metriken für das Monitoring-Dashboard

const CRITICAL_METRICS = {
  // Verfügbarkeit
  uptime: {
    target: 99.9,
    alert_threshold: 99.5,
    measurement: 'percentage',
  },
  
  // Performance
  response_time_p95: {
    target: 500,
    alert_threshold: 1000,
    measurement: 'milliseconds',
  },
  
  // Sicherheit
  failed_login_rate: {
    target: 0,
    alert_threshold: 10, // pro Minute
    measurement: 'per_minute',
  },
  
  // Datenbank
  db_connection_pool: {
    target: 50,
    alert_threshold: 80, // Prozent genutzt
    measurement: 'percentage',
  },
  
  // Audit-Integrität
  audit_chain_valid: {
    target: true,
    alert_threshold: false,
    measurement: 'boolean',
  },
};

const WARNING_METRICS = {
  // Speicher
  disk_usage: {
    target: 50,
    alert_threshold: 80,
    measurement: 'percentage',
  },
  
  // Rate Limits
  rate_limit_hits: {
    target: 0,
    alert_threshold: 100, // pro Stunde
    measurement: 'per_hour',
  },
  
  // Backup
  last_backup_age: {
    target: 1,
    alert_threshold: 24,
    measurement: 'hours',
  },
};
```

### 3.4 Alerting-Konfiguration

| Alert-Level | Reaktionszeit | Benachrichtigung | Beispiele |
|-------------|---------------|------------------|-----------|
| P1 - Kritisch | 15 Minuten | Telefon + SMS + Slack | System down, Datenverlust |
| P2 - Hoch | 1 Stunde | SMS + Slack + E-Mail | Auth-Fehler, hohe Fehlerrate |
| P3 - Mittel | 4 Stunden | Slack + E-Mail | Performance-Degradation |
| P4 - Niedrig | 24 Stunden | E-Mail | Warnungen, Info |

---

## 4. Incident-Response

### 4.1 Incident-Response-Plan

```
┌─────────────────────────────────────────────────────────────┐
│                 INCIDENT-RESPONSE-PROZESS                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ERKENNUNG                                               │
│     ├── Automatische Alerts                                 │
│     ├── Manuelle Meldung                                    │
│     └── Externe Meldung (Kunde, Behörde)                    │
│              │                                              │
│              ▼                                              │
│  2. KLASSIFIZIERUNG (max. 15 Min)                          │
│     ├── Schweregrad bestimmen (P1-P4)                       │
│     ├── Betroffene Systeme identifizieren                   │
│     └── Incident Commander benennen                         │
│              │                                              │
│              ▼                                              │
│  3. EINDÄMMUNG (abhängig von Schweregrad)                  │
│     ├── Sofortmaßnahmen                                     │
│     ├── Isolation betroffener Systeme                       │
│     └── Beweissicherung starten                             │
│              │                                              │
│              ▼                                              │
│  4. BEHEBUNG                                                │
│     ├── Root Cause Analysis                                 │
│     ├── Fix implementieren                                  │
│     └── Testen in Staging                                   │
│              │                                              │
│              ▼                                              │
│  5. WIEDERHERSTELLUNG                                       │
│     ├── Schrittweise Wiederinbetriebnahme                   │
│     ├── Monitoring verstärken                               │
│     └── Kunden informieren                                  │
│              │                                              │
│              ▼                                              │
│  6. POST-MORTEM (innerhalb 5 Werktage)                     │
│     ├── Dokumentation                                       │
│     ├── Lessons Learned                                     │
│     └── Präventionsmaßnahmen                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Datenschutzvorfall-Meldepflichten

| Vorfall-Typ | Meldepflicht | Frist | Empfänger |
|-------------|--------------|-------|-----------|
| Datenpanne mit hohem Risiko | Ja | 72 Stunden | Aufsichtsbehörde |
| Datenpanne mit hohem Risiko für Betroffene | Ja | Unverzüglich | Betroffene Personen |
| Versuchter Angriff ohne Datenzugriff | Nein | - | Interne Dokumentation |
| Technischer Ausfall ohne Datenverlust | Nein | - | Interne Dokumentation |

### 4.3 Notfall-Kontakte

```markdown
## Notfall-Kontaktliste (Template)

### Intern
| Rolle | Name | Telefon | E-Mail |
|-------|------|---------|--------|
| Incident Commander (Primary) | [Name] | [Telefon] | [E-Mail] |
| Incident Commander (Backup) | [Name] | [Telefon] | [E-Mail] |
| CTO / Tech Lead | [Name] | [Telefon] | [E-Mail] |
| Datenschutzbeauftragter | [Name] | [Telefon] | [E-Mail] |
| Geschäftsführung | [Name] | [Telefon] | [E-Mail] |

### Extern
| Rolle | Organisation | Telefon | E-Mail |
|-------|--------------|---------|--------|
| Aufsichtsbehörde | [Landesbehörde] | [Telefon] | [E-Mail] |
| Hosting-Provider NOC | [Provider] | [Telefon] | [E-Mail] |
| Externe IT-Forensik | [Dienstleister] | [Telefon] | [E-Mail] |
| Rechtsanwalt (IT-Recht) | [Kanzlei] | [Telefon] | [E-Mail] |
| Cyber-Versicherung | [Versicherer] | [Telefon] | [Policen-Nr.] |
```

---

## 5. Deployment-Checkliste

### 5.1 Infrastruktur

| # | Aufgabe | Status | Verantwortlich | Datum |
|---|---------|--------|----------------|-------|
| 1 | EU-Hosting-Vertrag abgeschlossen | ☐ | IT-Leitung | |
| 2 | DNS-Konfiguration (primär + failover) | ☐ | DevOps | |
| 3 | SSL/TLS-Zertifikate (inkl. Auto-Renewal) | ☐ | DevOps | |
| 4 | CDN-Konfiguration (EU-only) | ☐ | DevOps | |
| 5 | DDoS-Schutz aktiviert | ☐ | DevOps | |
| 6 | Backup-System konfiguriert | ☐ | DevOps | |
| 7 | Backup-Wiederherstellung getestet | ☐ | DevOps | |
| 8 | Monitoring-System eingerichtet | ☐ | DevOps | |
| 9 | Alerting konfiguriert | ☐ | DevOps | |
| 10 | Log-Aggregation aktiv | ☐ | DevOps | |

### 5.2 Datenbank

| # | Aufgabe | Status | Verantwortlich | Datum |
|---|---------|--------|----------------|-------|
| 1 | Produktions-Schema deployed | ☐ | Backend | |
| 2 | RLS-Policies aktiv | ☐ | Backend | |
| 3 | Indizes optimiert | ☐ | Backend | |
| 4 | Connection Pooling konfiguriert | ☐ | DevOps | |
| 5 | Verschlüsselung at rest aktiv | ☐ | DevOps | |
| 6 | Verschlüsselung in transit aktiv | ☐ | DevOps | |
| 7 | Audit-Logging aktiv | ☐ | Backend | |
| 8 | Audit-Chain-Integrität verifiziert | ☐ | Backend | |

### 5.3 Anwendung

| # | Aufgabe | Status | Verantwortlich | Datum |
|---|---------|--------|----------------|-------|
| 1 | Produktions-Build erstellt | ☐ | Frontend | |
| 2 | Alle Tests bestanden | ☐ | QA | |
| 3 | E2E-Tests auf Staging erfolgreich | ☐ | QA | |
| 4 | Performance-Tests bestanden | ☐ | QA | |
| 5 | Security-Scan durchgeführt | ☐ | Security | |
| 6 | Dependency-Audit sauber | ☐ | Security | |
| 7 | CSP-Header konfiguriert | ☐ | Frontend | |
| 8 | Rate-Limiting aktiv | ☐ | Backend | |

### 5.4 Authentifizierung

| # | Aufgabe | Status | Verantwortlich | Datum |
|---|---------|--------|----------------|-------|
| 1 | E-Mail-Verifizierung konfiguriert | ☐ | Backend | |
| 2 | Passwort-Policies konfiguriert | ☐ | Backend | |
| 3 | MFA-Option verfügbar | ☐ | Backend | |
| 4 | Session-Management getestet | ☐ | QA | |
| 5 | Login-Attempt-Logging aktiv | ☐ | Backend | |
| 6 | Brute-Force-Schutz aktiv | ☐ | Backend | |

---

## 6. Sicherheits-Checkliste

### 6.1 Datenschutz & Compliance

| # | Anforderung | Status | Nachweis |
|---|-------------|--------|----------|
| 1 | DSGVO-konforme Datenschutzerklärung veröffentlicht | ☐ | URL |
| 2 | Cookie-Banner implementiert | ☐ | Screenshot |
| 3 | Verarbeitungsverzeichnis erstellt | ☐ | Dokument |
| 4 | TOM-Dokument erstellt | ☐ | Dokument |
| 5 | AVV-Vorlage für Kunden verfügbar | ☐ | Template |
| 6 | Datenschutz-Folgenabschätzung durchgeführt | ☐ | Dokument |
| 7 | Löschkonzept dokumentiert | ☐ | Dokument |
| 8 | Betroffenenrechte-Prozess definiert | ☐ | Dokument |

### 6.2 Technische Sicherheit

| # | Maßnahme | Status | Prüfmethode |
|---|----------|--------|-------------|
| 1 | HTTPS erzwungen (HSTS) | ☐ | SSL Labs Test |
| 2 | TLS 1.2+ erzwungen | ☐ | SSL Labs Test |
| 3 | Sichere HTTP-Headers (CSP, X-Frame-Options, etc.) | ☐ | Security Headers Check |
| 4 | SQL-Injection geschützt (Prepared Statements) | ☐ | Code Review |
| 5 | XSS geschützt (Output Encoding) | ☐ | Code Review |
| 6 | CSRF-Schutz aktiv | ☐ | Pentest |
| 7 | Input-Validierung implementiert | ☐ | Code Review |
| 8 | Keine sensiblen Daten in URLs | ☐ | Code Review |
| 9 | Sichere Session-Konfiguration | ☐ | Config Review |
| 10 | Keine Default-Credentials | ☐ | Config Review |

### 6.3 Zugriffsschutz

| # | Maßnahme | Status | Prüfmethode |
|---|----------|--------|-------------|
| 1 | RLS auf allen sensitiven Tabellen | ☐ | DB Review |
| 2 | Rollen-basierte Zugriffskontrolle (RBAC) | ☐ | Funktionstest |
| 3 | Principle of Least Privilege | ☐ | Permission Review |
| 4 | API-Rate-Limiting | ☐ | Lasttest |
| 5 | Admin-Bereich zusätzlich geschützt | ☐ | Funktionstest |

### 6.4 Audit & Logging

| # | Maßnahme | Status | Prüfmethode |
|---|----------|--------|-------------|
| 1 | Alle Authentifizierungsevents geloggt | ☐ | Log Review |
| 2 | Alle Datenänderungen geloggt | ☐ | Log Review |
| 3 | Alle Admin-Aktionen geloggt | ☐ | Log Review |
| 4 | Log-Integrität geschützt | ☐ | Chain Verification |
| 5 | Logs vor unbefugtem Zugriff geschützt | ☐ | Permission Review |
| 6 | Log-Aufbewahrung konfiguriert | ☐ | Config Review |

---

## 7. Go-Live-Kriterien

### 7.1 Must-Have (Blocker für Go-Live)

| # | Kriterium | Status | Abnahme durch |
|---|-----------|--------|---------------|
| 1 | Alle P1-Bugs behoben | ☐ | QA Lead |
| 2 | Security-Scan ohne kritische Findings | ☐ | Security |
| 3 | Backup-Wiederherstellung erfolgreich getestet | ☐ | DevOps |
| 4 | Datenschutzdokumentation vollständig | ☐ | DSB |
| 5 | Rechtliche Dokumente freigegeben | ☐ | Rechtsabteilung |
| 6 | Performance unter Last akzeptabel | ☐ | DevOps |
| 7 | Monitoring & Alerting funktional | ☐ | DevOps |
| 8 | Incident-Response-Plan dokumentiert | ☐ | IT-Leitung |
| 9 | Support-Prozesse definiert | ☐ | Support |
| 10 | Rollback-Prozedur dokumentiert | ☐ | DevOps |

### 7.2 Should-Have (Empfohlen vor Go-Live)

| # | Kriterium | Status | Abnahme durch |
|---|-----------|--------|---------------|
| 1 | Alle P2-Bugs behoben | ☐ | QA Lead |
| 2 | Dokumentation vollständig | ☐ | Produktmanagement |
| 3 | Schulungsmaterial erstellt | ☐ | Produktmanagement |
| 4 | FAQ/Hilfe-Bereich implementiert | ☐ | Support |
| 5 | Beta-Feedback eingearbeitet | ☐ | Produktmanagement |

### 7.3 Go-Live-Entscheidung

```markdown
## Go-Live-Freigabe

**Datum:** ____________
**Geplanter Go-Live:** ____________

### Freigaben

| Rolle | Name | Unterschrift | Datum |
|-------|------|--------------|-------|
| Geschäftsführung | | | |
| CTO / Tech Lead | | | |
| Datenschutzbeauftragter | | | |
| QA Lead | | | |
| Security Officer | | | |

### Bedingungen / Auflagen

1. ____________________________________________
2. ____________________________________________
3. ____________________________________________

### Rollback-Trigger

Bei folgenden Ereignissen wird automatisch ein Rollback eingeleitet:
- [ ] Datenverlust festgestellt
- [ ] Kritische Sicherheitslücke entdeckt
- [ ] Systemausfall > 30 Minuten
- [ ] Fehlerrate > 5%
```

---

## Anhang

### A. Nützliche Befehle

```bash
# Backup-Status prüfen
# (Provider-spezifisch)

# Audit-Chain verifizieren
# Über Supabase SQL Editor oder App ausführen

# Log-Analyse (Beispiel für Fehler letzte Stunde)
# Über Lovable Cloud Logs-Interface

# SSL-Zertifikat prüfen
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Security Headers prüfen
curl -I https://your-domain.com
```

### B. Referenzen

- [DSGVO-Text](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [BSI IT-Grundschutz](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [EntgTranspG](https://www.gesetze-im-internet.de/entgtranspg/)
- [EU-Entgelttransparenz-Richtlinie](https://eur-lex.europa.eu/eli/dir/2023/970/oj)

### C. Versionshistorie

| Version | Datum | Autor | Änderungen |
|---------|-------|-------|------------|
| 1.0 | [Datum] | [Name] | Initiale Version |
