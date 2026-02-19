# Preiskonzept: KlarGehalt SaaS

Dieses Dokument skizziert das Preis- und Geschäftsmodell für KlarGehalt, basierend auf der aktuellen technischen Implementierung (EU-Konformität, KI-Analysen, Gender Pay Gap Dashboard).

Das Modell unterscheidet zwischen **Self-Service (SaaS)** und **Guided Service (SaaS + Beratung)**.

---

## 1. Preis-Strategie & Metriken

Da es sich um ein HR-Tool zur Entgelttransparenz handelt, ist die **Anzahl der Mitarbeiter (Headcount)** die fairste und üblichste Skalierungsgröße. Größere Firmen haben komplexere Datenstrukturen und ziehen mehr Wert aus der Analyse.

**Kern-Metrik:** Preis pro Mitarbeiter / Monat (oder gestaffelte Pakete).

---

## 2. Die Modelle im Detail

### A. Self-Service ("KlarGehalt Essential")
*Für Unternehmen, die ihre Daten selbst verwalten und primär die gesetzlichen Compliance-Anforderungen erfüllen wollen.*

*   **Zielgruppe:** KMUs (50–250 MA) mit eigener HR-Abteilung, aber wenig Budget für teure Berater.
*   **Software-Features:**
    *   Voller Zugriff auf das Pay Equity Dashboard (HR-Ansicht).
    *   Automatisierte Gender Pay Gap Berechnung.
    *   Standard KI-Erklärungen für Abweichungen (begrenzte Anzahl/Monat).
    *   Gehaltsbänder verwalten.
    *   Mitarbeiter-Dashboard (Lesezugriff für Angestellte).
    *   Export der gesetzlich geforderten Berichte.
*   **Service-Level:**
    *   Onboarding via Video-Tutorials & Doku.
    *   Support per E-Mail (SLA: 48h).
*   **Preis-Indikation:**
    *   **3,50 € - 5,00 €** pro Mitarbeiter/Monat (bei jährlicher Zahlung).
    *   *Beispielrechnung (100 MA):* ca. 400 € / Monat.

### B. Guided ("KlarGehalt Professional")
*Für Unternehmen, die nicht nur messen, sondern ihre Gehaltsstruktur aktiv verbessern wollen und externe Expertise benötigen.*

*   **Zielgruppe:** Wachsende Unternehmen (50–1000 MA) oder Firmen mit identifizierten "roten" Gaps, die Handlungsdruck haben.
*   **Software-Features (Plus):**
    *   Alles aus *Essential*.
    *   **Strategie-Modul:** "What-If"-Simulationen (Was kostet es, den Gap zu schließen?).
    *   Erweiterte KI-Analysen & Vorschläge für Maßnahmen.
    *   Historische Trend-Analysen & Forecasting.
*   **Service-Level (Der "Berater"-Faktor):**
    *   **Initiales Audit:** 1x jährlicher Deep-Dive Check durch einen Experten.
    *   **Persönliches Onboarding:** Einrichtung der Datenstruktur durch KlarGehalt-Team.
    *   **Quartals-Calls:** 30 Min. Review der KPIs mit einem Berater.
    *   Priority Support.
*   **Preis-Indikation:**
    *   Basisgebühr (SaaS): **6,00 € - 8,00 €** pro Mitarbeiter/Monat.
    *   Einmalige Setup-Fee (Consulting): **1.500 € - 3.000 €** (für Datenbereinigung & Ersteinrichtung).
    *   *Beispielrechnung (100 MA):* ca. 700 € / Monat + Setup.

---

## 3. Zusätzliche Umsatzströme (Add-ons)

Diese Komponenten können zu beiden Paketen hinzugebucht werden, um den "Begleitungs-Faktor" flexibel zu erhöhen.

### Das "Fair Pay Zertifikat" (Audit)
*   **Was:** Einmalige, tiefgehende Prüfung der Entgeltstrukturen mit offiziellem Siegel/Zertifikat (sobald Gap < 5%).
*   **Preis:** Einmalig **2.500 € - 5.000 €** (je nach Größe).

### "Compliance Rettungspaket"
*   **Was:** Für Firmen, deren Analyse "rot" ist. Ein 3-Monats-Intensivprogramm mit einem Berater, um Maßnahmenpläne zu entwickeln.
*   **Preis:** Retainer-Basis (z.B. **3.000 € / Monat** für 3 Monate).

### KI-Paket "Unlimited"
*   **Was:** Unbegrenzte Nutzung der Gemini-KI für individuelle Mitarbeiteranfragen und Simulationen (bei Self-Service limitiert).
*   **Preis:** + **0,50 €** pro Mitarbeiter/Monat.

---

## 4. Übersichtstabelle für die Webseite

| Feature | Self-Service (Essential) | Guided (Professional) |
| :--- | :---: | :---: |
| **Preisstruktur** | Günstige Miete | Miete + Service-Fee |
| **Pay Gap Analyse** | ✅ | ✅ |
| **KI-Erklärungen** | Basis (Limit) | Erweitert (Unlimitiert) |
| **Simulationen (Strategie)** | ❌ | ✅ |
| **Mitarbeiter-Portal** | ✅ | ✅ |
| **Onboarding** | Self-Service (Video) | **Persönlich (Consultant)** |
| **Experten-Support** | Chat/Email | **Video-Calls (Quartal)** |
| **Daten-Audit** | Automatisch | **Manuell durch Experte** |

---

## 5. Implementierungs-Hinweise

Um dieses Modell in der App abzubilden, müssten wir folgende technische Anpassungen vornehmen:

1.  **Feature Flags (Subscription Plan):** In der `companies` Tabelle muss hinterlegt werden, welcher Plan (`essential` vs. `professional`) aktiv ist.
2.  **Sperren:** Das Modul "Strategie/Simulation" im Dashboard muss für *Essential*-Kunden gesperrt oder als "Upgrade"-Teaser sichtbar sein.
3.  **Booking-Link:** Für die "Guided"-Kunden sollte im Dashboard ein direkter Link zur Terminbuchung beim Berater (via Calendly o.ä.) integriert sein.
