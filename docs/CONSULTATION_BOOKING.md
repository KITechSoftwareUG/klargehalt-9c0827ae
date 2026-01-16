# 🗓️ Beratungstermin-Buchungssystem

## Übersicht

Das Beratungstermin-Buchungssystem ermöglicht es Nutzern, direkt online Termine mit Compliance-Beratern zu vereinbaren. Es bietet drei verschiedene Beratungsformate und eine intuitive Buchungsoberfläche.

## Features

### ✅ Implementiert

1. **3 Beratungsformate**
   - **Video-Call** (60 Min) - Zoom/Teams
   - **Telefon** (45 Min) - Klassisches Gespräch
   - **Vor Ort** (90 Min) - Persönliches Treffen in Berlin

2. **Kalender-Integration**
   - Interaktiver Kalender zur Datumsauswahl
   - Wochenenden automatisch deaktiviert
   - Vergangene Tage nicht wählbar
   - Deutsche Lokalisierung

3. **Zeitslot-Auswahl**
   - Verfügbare Zeiten: 09:00 - 17:00 Uhr
   - Feste Zeitfenster (09:00, 10:00, 11:00, 13:00, 14:00, 15:00, 16:00)
   - Mittagspause berücksichtigt (12:00 ausgelassen)

4. **Kontaktformular**
   - Vollständiger Name
   - E-Mail
   - Telefon
   - Firmenname
   - Mitarbeiteranzahl
   - Optionale Nachricht

5. **Bestätigungsseite**
   - Zusammenfassung aller Buchungsdetails
   - Nächste Schritte
   - Navigation zu Dashboard/Startseite

### 🔄 In Entwicklung

- [ ] E-Mail-Benachrichtigungen
- [ ] Kalender-Datei (.ics) zum Download
- [ ] Automatische Berater-Zuweisung
- [ ] Video-Call-Link-Generierung
- [ ] Erinnerungen (24h vorher)
- [ ] Termin-Stornierung
- [ ] Termin-Umplanung

## Routen

### `/book-consulting`
Hauptseite für die Terminbuchung

**Schritte:**
1. Beratungsformat wählen
2. Datum, Zeit und Kontaktdaten eingeben
3. Bestätigung erhalten

## Datenbank

### Tabelle: `consultation_bookings`

```sql
CREATE TABLE consultation_bookings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  consultation_type TEXT, -- 'video', 'phone', 'in-person'
  scheduled_date DATE,
  scheduled_time TIME,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  employee_count TEXT,
  message TEXT,
  status TEXT, -- 'pending', 'confirmed', 'completed', 'cancelled'
  consultant_id UUID,
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);
```

### Status-Workflow

```
pending → confirmed → completed
   ↓
cancelled
```

- **pending**: Anfrage eingereicht, wartet auf Bestätigung
- **confirmed**: Von Berater bestätigt, Meeting-Link erstellt
- **completed**: Termin durchgeführt
- **cancelled**: Termin abgesagt

## Beratungsformate

### 1. Video-Call
- **Dauer**: 60 Minuten
- **Plattform**: Zoom oder Microsoft Teams
- **Ideal für**: Remote-Unternehmen, schnelle Beratung
- **Vorbereitung**: Link wird 24h vorher per E-Mail gesendet

### 2. Telefon
- **Dauer**: 45 Minuten
- **Ideal für**: Schnelle Fragen, mobile Erreichbarkeit
- **Vorbereitung**: Berater ruft zur vereinbarten Zeit an

### 3. Vor Ort
- **Dauer**: 90 Minuten
- **Standort**: Berlin
- **Ideal für**: Ausführliche Beratung, Workshop-Charakter
- **Vorbereitung**: Adresse wird bei Bestätigung mitgeteilt

## Integration mit Onboarding

Das Buchungssystem ist direkt im Onboarding integriert:

**Onboarding Schritt 3** → Beratungsoption "Full-Service" wählen → Button "Termin anfragen" → Weiterleitung zu `/book-consulting`

## Workflow

### 1. Nutzer bucht Termin

```
Nutzer wählt Format → Datum & Zeit → Kontaktdaten → Absenden
```

### 2. System erstellt Buchung

```sql
INSERT INTO consultation_bookings (
  user_id,
  consultation_type,
  scheduled_date,
  scheduled_time,
  status = 'pending'
)
```

### 3. Benachrichtigungen (geplant)

- **Nutzer**: Bestätigungs-E-Mail mit Details
- **Berater**: Neue Buchungsanfrage
- **System**: Eintrag in Admin-Dashboard

### 4. Berater bestätigt (geplant)

```sql
UPDATE consultation_bookings
SET status = 'confirmed',
    consultant_id = [BERATER_ID],
    meeting_link = [VIDEO_LINK],
    confirmed_at = NOW()
WHERE id = [BOOKING_ID]
```

### 5. Erinnerungen (geplant)

- **24h vorher**: E-Mail mit Meeting-Link
- **1h vorher**: SMS-Erinnerung (optional)

## Admin-Funktionen (geplant)

### Berater-Dashboard

- Übersicht aller Buchungen
- Kalenderansicht
- Termin bestätigen/ablehnen
- Meeting-Link hinzufügen
- Notizen zu Terminen

### Verfügbarkeits-Management

- Arbeitszeiten festlegen
- Urlaubstage blockieren
- Maximale Termine pro Tag
- Pufferzeiten zwischen Terminen

## E-Mail-Templates (geplant)

### 1. Buchungsbestätigung (an Nutzer)

```
Betreff: Ihre Terminanfrage bei KlarGehalt

Sehr geehrte/r [NAME],

vielen Dank für Ihre Terminanfrage!

Termindetails:
- Datum: [DATUM]
- Uhrzeit: [ZEIT]
- Format: [FORMAT]
- Dauer: [DAUER]

Wir melden uns innerhalb von 24 Stunden bei Ihnen.

Mit freundlichen Grüßen
Ihr KlarGehalt-Team
```

### 2. Termin bestätigt (an Nutzer)

```
Betreff: Ihr Beratungstermin ist bestätigt

Sehr geehrte/r [NAME],

Ihr Termin wurde bestätigt!

[Wenn Video-Call:]
Meeting-Link: [LINK]
Meeting-ID: [ID]
Passwort: [PASSWORT]

Bitte seien Sie 5 Minuten vor Beginn bereit.

Mit freundlichen Grüßen
[BERATER_NAME]
```

### 3. Erinnerung (24h vorher)

```
Betreff: Erinnerung: Ihr Termin morgen

Sehr geehrte/r [NAME],

Dies ist eine Erinnerung an Ihren Termin morgen:

Datum: [DATUM]
Uhrzeit: [ZEIT]
Format: [FORMAT]

[Meeting-Link falls Video-Call]

Bis morgen!
[BERATER_NAME]
```

## Kalender-Integration (.ics)

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KlarGehalt//Consultation//DE
BEGIN:VEVENT
UID:[BOOKING_ID]@klargehalt.de
DTSTAMP:[CREATED_AT]
DTSTART:[SCHEDULED_DATE]T[SCHEDULED_TIME]
DURATION:PT[DURATION]M
SUMMARY:Beratungstermin - KlarGehalt
DESCRIPTION:[CONSULTATION_TYPE] mit [CONSULTANT_NAME]
LOCATION:[MEETING_LINK or ADDRESS]
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

## API-Endpunkte (geplant)

### `POST /api/consultations`
Neue Buchung erstellen

### `GET /api/consultations/:id`
Buchungsdetails abrufen

### `PATCH /api/consultations/:id`
Buchung aktualisieren (Status, Meeting-Link)

### `DELETE /api/consultations/:id`
Buchung stornieren

### `GET /api/consultations/availability`
Verfügbare Zeitslots abrufen

## Testing

### Manuelle Tests

1. **Buchung erstellen**
   ```
   - Zu /book-consulting navigieren
   - Format wählen (z.B. Video-Call)
   - Datum wählen (nächste Woche)
   - Zeit wählen (10:00)
   - Kontaktdaten eingeben
   - Absenden
   - Bestätigungsseite prüfen
   ```

2. **Validierung testen**
   ```
   - Versuchen ohne Datum fortzufahren
   - Versuchen ohne Kontaktdaten fortzufahren
   - Wochenende wählen (sollte deaktiviert sein)
   - Vergangenes Datum wählen (sollte deaktiviert sein)
   ```

3. **Datenbank prüfen**
   ```sql
   SELECT * FROM consultation_bookings
   WHERE user_id = [TEST_USER_ID]
   ORDER BY created_at DESC;
   ```

## Deployment

### Datenbank-Migration

```bash
# Migration ausführen
supabase db push

# Oder manuell
psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/migrations/20260114_create_consultation_bookings.sql
```

### Environment Variables

Keine zusätzlichen Variablen erforderlich.

## Metriken (geplant)

- Anzahl Buchungen pro Woche
- Beliebtestes Beratungsformat
- Durchschnittliche Vorlaufzeit
- Stornierungsrate
- Berater-Auslastung

## Kosten & Preise

- **Video-Call**: Im Full-Service-Plan enthalten (499€/Monat)
- **Telefon**: Im Full-Service-Plan enthalten
- **Vor Ort**: Im Full-Service-Plan enthalten + ggf. Reisekosten

## Support

- **Technische Probleme**: support@klargehalt.de
- **Termin-Änderungen**: consulting@klargehalt.de
- **Notfall-Hotline**: +49 (0) 30 123 456 789

---

**Status**: ✅ Basis-Funktionalität implementiert  
**Version**: 1.0.0  
**Letzte Aktualisierung**: 14.01.2026  
**Nächste Schritte**: E-Mail-Integration, Berater-Dashboard
