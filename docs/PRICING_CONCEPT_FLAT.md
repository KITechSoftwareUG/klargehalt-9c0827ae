# SaaS-Preiskonzept: Pauschal-Modell (Tiered Pricing)

Anstatt "pro Mitarbeiter" abzurechnen, setzt dieses Konzept auf **feste, planbare Unternehmens-Pauschalen** (Tiers). Das bietet Stabilität für beide Seiten: Der Kunde kennt seine exakten monatlichen Kosten (keine Nachberechnung bei Neueinstellungen), und KlarGehalt hat planbaren MRR (Monthly Recurring Revenue).

---

## 1. Die Strategie: "Compliance vs. Excellence"

Wir unterscheiden nicht nach Kopfzahl, sondern nach dem **Mehrwert**, den das Unternehmen sucht:
1.  Will ich nur meine gesetzliche Pflicht erfüllen? (**Compliance**)
2.  Will ich meine Vergütung aktiv steuern und verbessern? (**Management**)
3.  Will ich Transformation und Experten-Begleitung? (**Consulting**)

---

## 2. Die Pakete (Monatliche Pauschalen)

### Tier 1: "Compliance Basis"
*Für Unternehmen, die primär die gesetzlichen Anforderungen (Entgelttransparenzgesetz) abhaken wollen.*

*   **Zielgruppe:** KMUs, die "ruhig schlafen" wollen.
*   **Features:**
    *   ✅ **Struktur-Builder:** Self-Service Konfiguration von Lohnbändern & Job-Kategorien.
    *   ✅ **Kriterien-Definition:** Parameter für Gehaltsunterschiede festlegen (Erfahrung, Verantwortung, etc.).
    *   ✅ Automatisierter Entgelt-Bericht (PDF-Export für Behörden/Betriebsrat).
    *   ✅ Einsicht in Gender Pay Gap (Status Quo).
    *   ✅ Mitarbeiter-Auskunftsportal (Recht auf Auskunft erfüllt).
    *   ❌ Keine Simulationen / Strategie.
*   **Service:** Self-Service (Hilfe-Center).
*   **Preis:** **99 € / Monat** (bei jährlicher Zahlung).

### Tier 2: "Fair Pay Manager" (Empfohlen)
*Das operative Steuerungsinstrument für HR-Abteilungen. Hier liegt der echte SaaS-Mehrwert.*

*   **Zielgruppe:** Aktive HR-Teams, die faire Vergütung als Employer-Branding-Vorteil nutzen.
*   **Features:**
    *   Alles aus *Tier 1*.
    *   ✅ **Interaktives Dashboard:** Tiefe Analysen nach Abteilungen/Levels.
    *   ✅ **Strategie-Modul:** "Was-wäre-wenn"-Simulationen (Budgetplanung zur Schließung des Gaps).
    *   ✅ **KI-Copilot:** Automatische Erklärungen für Ausreißer & Handlungsempfehlungen.
    *   ✅ Volle Datenhistorie & Trends.
*   **Service:** Priority Email-Support.
*   **Preis:** **299 € / Monat**.

### Tier 3: "Excellence & Audit" (Hybrid-Modell)
*Die "Sorglos"-Lösung inklusive persönlicher Beratung.*

*   **Zielgruppe:** Unternehmen im Wandel oder vor einer Zertifizierung.
*   **Features:**
    *   Alles aus *Tier 2*.
    *   ✅ **Persönlicher Zertifizierungs-Check:** 1x jährlich manuelles Audit durch Experten.
    *   ✅ **Quartals-Review:** 4x im Jahr persönlicher Video-Call (30 Min) zur Besprechung der KPIs.
    *   ✅ **Managed Setup:** Wir pflegen Datenänderungen / neue Strukturen für den Kunden ein.
*   **Service:** Persönlicher Account Manager (Telefon & Video).
*   **Preis:** **899 € / Monat**.

---

## 3. Einmalige Setup-Pakete (Onboarding)

Um die Einstiegshürde niedrig zu halten, aber den manuellen Aufwand zu decken, werden Onboardings separat verkauft.

*   **"Self-Start" (0 €):**
    *   Kunde lädt CSV selbst hoch.
    *   Zugriff auf Video-Academy.
    *   *Nur verfügbar für Tier 1 & 2.*

*   **"Guided Setup" (1.500 € einmalig):**
    *   Datenclearing durch KlarGehalt-Experten.
    *   Einrichtung der Job-Architektur (Levels & Familien).
    *   1h Schulung für das HR-Team.
    *   *Optional für Tier 1 & 2, Inklusive bei Jahreszahlung Tier 3.*

---

## 4. Warum dieses Modell stabil ist

1.  **Keine Churn-Gefahr bei Personalabbau:** Anders als beim Per-User-Modell kündigen Kunden nicht sofort, wenn sie Mitarbeiter entlassen, da der Preis für die *Software-Infrastruktur* gleich bleibt.
2.  **Höherer Up-Sell Fokus:** Der Sprung von 99 € auf 299 € ist logisch argumentierbar über Features (Strategie/KI), nicht über Bestrafung von Wachstum.
3.  **Planbare Service-Kapazität:** Im Tier 3 ist die Beratungsleistung (4 Calls / Jahr) fest gedeckelt und somit planbar, anders als bei "Stundenkontingenten".

---

## 5. Implementierung in der App

*   **Dashboard-Logik:** 
    *   User im *Tier 1* sehen den Reiter "Strategie", aber er ist ausgegraut ("Upgrade to Manager").
    *   User im *Tier 1* sehen nur "Status Quo", keine Historie.
*   **Billing:**
    *   Abrechnung erfolgt automatisiert über Stripe (wiederkehrend).
    *   Upgrades können direkt im Tool gebucht werden.
