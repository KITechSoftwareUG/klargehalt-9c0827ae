# EU-Entgelttransparenzrichtlinie 2023/970 — Referenz

> Diese Datei ist die **Single Source of Truth** für alles, was die Richtlinie verlangt — Bezug-Punkt für Produktentscheidungen, Marketing-Wording, Compliance-Features und Sales-Argumente. Wenn ein Feature gebaut, ein Pricing-Punkt formuliert oder eine Landingpage geschrieben wird: hier nachschlagen, dass es zur Rechtslage passt.

**Offizieller Titel:** Richtlinie (EU) 2023/970 des Europäischen Parlaments und des Rates zur Stärkung der Anwendung des Grundsatzes des gleichen Entgelts für Männer und Frauen bei gleicher oder gleichwertiger Arbeit durch Lohntransparenz.

**Transponierungsfrist:** **7. Juni 2026** — bis dahin müssen alle EU-Mitgliedstaaten die Richtlinie in nationales Recht (in DE voraussichtlich als Reform/Ablösung des EntgTranspG) überführen.

**Kern-Prinzip:** "Gleicher Lohn für gleiche oder gleichwertige Arbeit" wird von einem Lippenbekenntnis zu einer einklagbaren Compliance-Anforderung mit Beweislastumkehr.

---

## 1. Transparenzpflicht vor der Einstellung (Recruiting)

Greift ab dem nationalen Umsetzungsdatum für **alle Arbeitgeber unabhängig von der Größe**.

| Pflicht | Inhalt |
|---|---|
| **Offenlegungspflicht** | Bewerbern muss **vor** dem Vorstellungsgespräch das Einstiegsgehalt oder eine Entgeltspanne mitgeteilt werden — entweder direkt in der Stellenanzeige oder vorab schriftlich. |
| **Verbot der Entgelthistorie** | Bewerber dürfen nicht nach aktuellem oder früherem Gehalt gefragt werden. Zweck: bestehende Diskriminierungen sollen nicht von Job zu Job "mitgeschleppt" werden. |
| **Geschlechtsneutralität** | Stellenausschreibungen und Auswahlverfahren müssen vollständig geschlechtsneutral formuliert sein. |

**Klargehalt-Bezug:** Modul `job_postings` (`/dashboard/job-postings`) — Stellenanzeigen-Compliance ist Teil der Plattform.

---

## 2. Auskunftsanspruch der Beschäftigten

Greift ab dem nationalen Umsetzungsdatum für **alle Arbeitgeber unabhängig von der Größe** (auch < 100 MA!).

| Recht | Inhalt |
|---|---|
| **Individuelles Auskunftsrecht** | Jeder Arbeitnehmer kann schriftlich Auskunft verlangen über (a) sein individuelles Entgeltniveau und (b) die **durchschnittlichen Entgeltniveaus, aufgeschlüsselt nach Geschlecht**, für Gruppen von Arbeitnehmern, die gleiche oder gleichwertige Arbeit verrichten. |
| **Kriterien-Transparenz** | Unternehmen müssen offenlegen, nach welchen objektiven, geschlechtsneutralen Kriterien Entgelt und berufliche Entwicklung festgelegt werden. |
| **Offenlegungsverbot ist nichtig** | Vertragsklauseln, die Mitarbeiter daran hindern, über ihr Gehalt zu sprechen, sind ungültig — soweit es der Durchsetzung des Gleichbehandlungsprinzips dient. |

**Klargehalt-Bezug:** Modul `info_requests` + `/dashboard/my-salary` + `/dashboard/hr-requests` + `/dashboard/rights-notifications`.

---

## 3. Berichtspflichten — gestaffelt nach Unternehmensgröße

| Unternehmensgröße | Erster Bericht fällig | Folgerhythmus |
|---|---|---|
| **> 250 MA** | 7. Juni 2027 (Daten aus 2026) | **jährlich** |
| **150 – 249 MA** | 7. Juni 2027 (Daten aus 2026) | alle 3 Jahre |
| **100 – 149 MA** | 7. Juni 2031 (Daten aus 2030) | alle 3 Jahre |
| **< 100 MA** | Keine automatische Pflicht* | freiwillig (oder länderabhängig) |

> *Auch für < 100 MA gilt: Individueller Auskunftsanspruch (§2) und Transparenzpflicht im Recruiting (§1) greifen trotzdem.

**Inhalt des Berichts (Auszug):**
- Gender Pay Gap (Brutto) gesamt
- Gender Pay Gap bei variablen Bestandteilen (Boni, Sachbezüge, Provisionen)
- Median Gender Pay Gap
- Anteil männlicher/weiblicher Arbeitnehmer in jedem Quartil der Lohnverteilung
- Pay Gap aufgeschlüsselt nach Gruppen gleicher/gleichwertiger Arbeit

**Klargehalt-Bezug:** Modul `PayGapReport` (`/dashboard/reports`, `/dashboard/pay-equity-mgmt`) — **NICHT in Basis-Tier enthalten**, da Basis (1–50 MA) keiner Berichtspflicht unterliegt.

---

## 4. Die 5-%-Hürde und das Joint Pay Assessment

**Der kritischste operative Trigger der Richtlinie.**

Stellt ein Bericht ein Lohngefälle von **mehr als 5 %** zwischen Frauen und Männern in einer Kategorie gleicher/gleichwertiger Arbeit fest, das **nicht** durch objektive, geschlechtsneutrale Faktoren (Dienstalter, Leistung, Qualifikation, Berufserfahrung, Schichtarbeit etc.) gerechtfertigt werden kann, und wird der Unterschied nicht **innerhalb von 6 Monaten** korrigiert, dann:

1. ist eine **Gemeinsame Entgeltbewertung (Joint Pay Assessment)** mit den Arbeitnehmervertretern (Betriebsrat) **verpflichtend**;
2. müssen Maßnahmen zur Schließung der Lücke innerhalb einer angemessenen Frist ergriffen werden;
3. müssen die Ursachen, identifizierte Maßnahmen und deren Wirksamkeit dokumentiert werden.

**Klargehalt-Bezug:** Modul `joint_assessment` (`/dashboard/joint-assessment`) — Pflicht-Workflow für den Auslöse-Fall.

---

## 5. Rechtsfolgen — Beweislastumkehr & Sanktionen

Die Richtlinie gibt Arbeitnehmern scharfe Schwerter:

| Mechanismus | Bedeutung für Arbeitgeber |
|---|---|
| **Beweislastumkehr** | Behauptet ein Arbeitnehmer eine Entgeltdiskriminierung und ist der Arbeitgeber seinen Transparenzpflichten nicht nachgekommen, muss **der Arbeitgeber** beweisen, dass keine Diskriminierung vorlag — nicht der Arbeitnehmer. |
| **Voller Schadenersatz** | Anspruch auf vollständige Nachzahlung des entgangenen Entgelts, Entschädigung für entgangene Chancen (Boni, Beförderungen, Sachleistungen) und immaterielle Schäden. |
| **Sanktionen** | Mitgliedstaaten müssen wirksame und abschreckende Geldbußen festlegen, die sich am Gesamtumsatz orientieren können. Tatbestandsmäßig sind sowohl Berichts- als auch Auskunftspflichtverstöße. |

**Konsequenz für das Produkt:** Ohne dokumentierte, sachliche Begründung jeder Gehaltsentscheidung kann ein Unternehmen die Beweislastumkehr im Streitfall nicht bedienen. Genau dafür existiert `salary_decisions` (append-only Decision-Trail) — **in jedem Tier enthalten, auch Basis**.

---

## 6. Action Plan für betroffene Unternehmen (= Sales-Argumente)

| Schritt | Klargehalt-Modul | Basis-Tier? |
|---|---|---|
| **Stellenbewertung systematisieren** (objektive Kriterien für "gleichwertige Arbeit": Belastung, Verantwortung, Ausbildung, Arbeitsbedingungen) | `job_profiles`, `job_levels`, `departments` | ✅ |
| **Lohn-Pre-Audit** (interne Gender-Pay-Gap-Analyse zum Monitoring) | `pay_bands`, `usePayEquity` Hook, `/dashboard/pay-equity-hr` | ✅ (Monitoring inkl., kein Berichts-Export) |
| **Recruiting-Prozesse anpassen** (Gehaltsspannen, kein Altgehalt-Fragen) | `job_postings` | ✅ |
| **Entgeltentscheidungen objektivieren & dokumentieren** | `salary_decisions` ← **das Produkt-Herzstück** | ✅ |
| **Externe Validierung** (defensible Position bei Streitfall) | `lawyer_reviews`, `lawyer_requests`, `lawyer_profiles` | Add-on (€799 / €399 Renewal) |
| **Audit-Trail führen** | `audit_logs` (immutable) | ✅ |
| **PDF-Bericht für Behörden** | `PayGapReport` Export | ❌ Professional+ |
| **Trend-Analyse über Zeit** | `trend_analysis` | ❌ Professional+ |
| **Joint Assessment durchführen können** | `/dashboard/joint-assessment` | ❌ Professional+ |

**Logik:** Basis = MA ≤ 50, also keine Berichtspflicht → reines Monitoring + Dokumentation. Professional = wachsende Firma mit Berichtspflicht ab 100 MA → Export + Joint Assessment.

---

## 7. Strikte Wording-Regeln (Marketing & UI)

Aus rechtlicher Vorsicht — niemals folgende Begriffe in Marketing, UI-Copy, Pricing-Seiten oder Mails verwenden:

| ❌ Vermeiden | ✅ Verwenden |
|---|---|
| "rechtssicher" | "von externem Rechtsberater geprüft" |
| "gesetzlich geprüft" | "anwaltlich geprüft (externer Rechtsanwalt)" |
| "100 % compliant" | "unterstützt Sie bei der Erfüllung der Anforderungen" |
| "Klage-sicher" | "im Streitfall vorbereitet, mit dokumentiertem Paper-Trail" |
| "Garantie" | "strukturierte Dokumentation Ihrer Entgeltentscheidungen" |

**Grund:** KlarGehalt ist eine Software, kein Rechtsdienstleister. Echtsicherheit bietet erst die externe anwaltliche Prüfung — und auch die garantiert nichts, sondern stützt die defensible Position.

---

## 8. Quellen & Weiterführendes

- **Richtlinie 2023/970 — EUR-Lex:** https://eur-lex.europa.eu/eli/dir/2023/970/oj
- **BMAS Deutschland — Umsetzung:** noch in Konsultation, Stand 2026-05 (laufend prüfen)
- **EntgTranspG (aktuelles deutsches Recht, wird novelliert oder abgelöst):** https://www.gesetze-im-internet.de/entgtranspg/

**Bei Updates (z. B. Umsetzungsgesetz veröffentlicht, BMAS-Verordnung):** Diese Datei aktualisieren, in der Commit-Message `docs(law):` nutzen, und Marketing/UI auf Konsistenz prüfen.
