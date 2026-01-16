# 🗓️ Beratungstermin-Buchung - Quick Start

## ✅ Was wurde implementiert

Ein vollständiges **Beratungstermin-Buchungssystem** mit:

### 1. **Buchungsseite** (`/book-consulting`)
- 3-Schritte-Prozess für Terminbuchung
- Interaktiver Kalender
- Zeitslot-Auswahl
- Kontaktformular
- Bestätigungsseite

### 2. **3 Beratungsformate**
- **Video-Call** (60 Min) - Zoom/Teams
- **Telefon** (45 Min) - Klassisches Gespräch  
- **Vor Ort** (90 Min) - Persönliches Treffen in Berlin

### 3. **Datenbank-Integration**
- Neue Tabelle `consultation_bookings`
- Status-Tracking (pending, confirmed, completed, cancelled)
- RLS-Policies für Datensicherheit

### 4. **Onboarding-Integration**
- Button "Termin anfragen" im Onboarding (Schritt 3)
- Direkte Weiterleitung zu `/book-consulting`

## 🚀 Wie es funktioniert

### Für Nutzer:

1. **Onboarding durchlaufen**
   - Schritt 3: "Full-Service Beratung" wählen
   - Button "Termin anfragen" klicken

2. **Oder direkt navigieren**
   - Zu `/book-consulting` gehen

3. **Termin buchen**:
   - **Schritt 1**: Beratungsformat wählen (Video/Telefon/Vor Ort)
   - **Schritt 2**: Datum & Zeit wählen + Kontaktdaten eingeben
   - **Schritt 3**: Bestätigung erhalten

4. **Nach Buchung**:
   - Bestätigungs-E-Mail erhalten (geplant)
   - Termin in Kalender eintragen
   - Auf Bestätigung warten (24h)

## 📁 Neue Dateien

```
✅ app/book-consulting/page.tsx                     # Buchungsseite
✅ supabase/migrations/20260114_*.sql               # Datenbank-Migration
✅ docs/CONSULTATION_BOOKING.md                     # Vollständige Dokumentation
```

## 🔄 Geänderte Dateien

```
✅ app/onboarding/page.tsx                          # Button-Integration
```

## 🎨 Features im Detail

### Kalender
- ✅ Deutsche Lokalisierung
- ✅ Wochenenden deaktiviert
- ✅ Vergangene Tage deaktiviert
- ✅ Responsive Design

### Zeitslots
- ✅ Feste Zeiten (09:00 - 17:00)
- ✅ Mittagspause berücksichtigt
- ✅ Dropdown-Auswahl

### Kontaktformular
- ✅ Name, E-Mail, Telefon
- ✅ Firma, Mitarbeiteranzahl
- ✅ Optionale Nachricht
- ✅ Validierung

### Bestätigung
- ✅ Zusammenfassung aller Details
- ✅ Nächste Schritte
- ✅ Navigation zu Dashboard/Home

## 🧪 Testen

### 1. Server starten
```bash
npm run dev
```

### 2. Datenbank-Migration ausführen
```bash
# Option 1: Supabase CLI
supabase db push

# Option 2: Manuell im Supabase Dashboard
# SQL Editor → Datei öffnen: supabase/migrations/20260114_create_consultation_bookings.sql
```

### 3. Buchung testen

**Variante A: Über Onboarding**
1. Zu `/onboarding` navigieren
2. Schritt 3 erreichen
3. "Full-Service" wählen
4. "Termin anfragen" klicken

**Variante B: Direkt**
1. Zu `/book-consulting` navigieren
2. Format wählen (z.B. Video-Call)
3. Datum wählen (nächste Woche, Werktag)
4. Zeit wählen (z.B. 10:00)
5. Kontaktdaten eingeben
6. "Termin anfragen" klicken
7. Bestätigungsseite prüfen

### 4. Datenbank prüfen

```sql
-- Alle Buchungen anzeigen
SELECT * FROM consultation_bookings
ORDER BY created_at DESC;

-- Buchungen eines Nutzers
SELECT * FROM consultation_bookings
WHERE user_id = '[USER_ID]';

-- Pending Buchungen
SELECT * FROM consultation_bookings
WHERE status = 'pending';
```

## 📊 Datenbank-Schema

```sql
consultation_bookings:
- id (UUID)
- user_id (UUID) → auth.users
- consultation_type (video/phone/in-person)
- scheduled_date (DATE)
- scheduled_time (TIME)
- full_name (TEXT)
- email (TEXT)
- phone (TEXT)
- company_name (TEXT)
- employee_count (TEXT)
- message (TEXT, optional)
- status (pending/confirmed/completed/cancelled)
- consultant_id (UUID, optional)
- meeting_link (TEXT, optional)
- notes (TEXT, optional)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## 🔄 Nächste Schritte (Roadmap)

### Phase 1: ✅ Basis-Buchung (Fertig)
- [x] Buchungsformular
- [x] Kalender-Integration
- [x] Datenbank-Speicherung
- [x] Bestätigungsseite

### Phase 2: 📧 E-Mail-Integration (Geplant)
- [ ] Bestätigungs-E-Mail an Nutzer
- [ ] Benachrichtigung an Berater
- [ ] Erinnerungs-E-Mails (24h vorher)
- [ ] Kalender-Datei (.ics) anhängen

### Phase 3: 👨‍💼 Berater-Dashboard (Geplant)
- [ ] Übersicht aller Buchungen
- [ ] Termin bestätigen/ablehnen
- [ ] Meeting-Link hinzufügen
- [ ] Notizen zu Terminen

### Phase 4: 📅 Erweiterte Funktionen (Geplant)
- [ ] Termin umplanen
- [ ] Termin stornieren
- [ ] Verfügbarkeits-Management
- [ ] Automatische Berater-Zuweisung

## 💡 Verwendung im Onboarding

Das Buchungssystem ist nahtlos ins Onboarding integriert:

```
Onboarding Schritt 3
  ↓
"Full-Service Beratung" wählen
  ↓
Button "Termin anfragen" erscheint
  ↓
Klick → Weiterleitung zu /book-consulting
  ↓
Termin buchen
  ↓
Zurück zum Onboarding oder Dashboard
```

## 🎯 Beratungsformate

| Format | Dauer | Ideal für | Plattform |
|--------|-------|-----------|-----------|
| **Video-Call** | 60 Min | Remote-Teams | Zoom/Teams |
| **Telefon** | 45 Min | Schnelle Fragen | Telefon |
| **Vor Ort** | 90 Min | Workshops | Berlin |

## 📞 Support & Hilfe

- **Vollständige Docs**: `docs/CONSULTATION_BOOKING.md`
- **Code**: `app/book-consulting/page.tsx`
- **Migration**: `supabase/migrations/20260114_create_consultation_bookings.sql`

## ✨ Highlights

✅ **Benutzerfreundlich** - Klarer 3-Schritte-Prozess  
✅ **Professionell** - Modernes Design mit Icons  
✅ **Flexibel** - 3 verschiedene Beratungsformate  
✅ **Sicher** - RLS-Policies schützen Daten  
✅ **Integriert** - Nahtlos im Onboarding eingebunden  
✅ **Responsive** - Funktioniert auf allen Geräten  

---

**Status**: ✅ Einsatzbereit  
**Version**: 1.0.0  
**Datum**: 14.01.2026  
**Nächster Schritt**: E-Mail-Integration
