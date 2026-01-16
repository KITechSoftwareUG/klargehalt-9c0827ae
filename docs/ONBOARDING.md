# Onboarding-System

## Übersicht

Das Onboarding-System führt neue Geschäftsführer und HR-Manager durch einen strukturierten 5-Schritte-Prozess, um ihr Unternehmen für die EU-Entgelttransparenzrichtlinie vorzubereiten.

## Onboarding-Flow

### Schritt 1: Rollenauswahl
- **Geschäftsführer (Admin)**: Voller Zugriff auf alle Funktionen
- **HR-Manager**: Verwaltung von Mitarbeitern und Gehaltsbändern

### Schritt 2: Mitarbeiteranzahl
Kategorien:
- 1-50 Mitarbeiter (Kleine Unternehmen)
- 51-250 Mitarbeiter (Mittelständische Unternehmen)
- 251-1.000 Mitarbeiter (Große Unternehmen)
- Mehr als 1.000 (Konzerne)

### Schritt 3: Beratungsoptionen
**Selbstständig (Kostenlos)**
- Plattform eigenständig nutzen
- Hilfe-Center und Dokumentation

**Geführtes Onboarding (Inklusive)**
- Schritt-für-Schritt Anleitung
- Video-Tutorials
- E-Mail-Support

**Full-Service Beratung (Ab 499€/Monat)**
- Persönlicher Compliance-Berater
- Individuelle Workshops
- Prioritäts-Support
- Terminvereinbarung möglich

### Schritt 4: Unternehmensdaten
- Vollständiger Name
- Firmenname
- Branche

### Schritt 5: Zusammenfassung & Abschluss
- Überprüfung aller Angaben
- Nächste Schritte werden angezeigt:
  1. Gehaltsbänder definieren
  2. Mitarbeiter hinzufügen
  3. Mitarbeiter einladen

## Technische Implementierung

### Route
`/onboarding` - Onboarding-Seite (nur für neue Admin/HR-Manager)

### Datenbank
**Tabelle: `onboarding_data`**
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key zu auth.users)
- company_id: UUID (Foreign Key zu companies)
- company_size: TEXT ('1-50', '51-250', '251-1000', '1000+')
- consulting_option: TEXT ('self-service', 'guided', 'full-service')
- completed_at: TIMESTAMPTZ
```

### Ablauf nach Registrierung

1. **Mitarbeiter (Employee)**:
   - Direkt zum Dashboard → `/dashboard`
   - Warten auf Einladung vom Admin

2. **Admin/HR-Manager**:
   - Zum Onboarding → `/onboarding`
   - Nach Abschluss: Firma wird erstellt
   - Weiterleitung zum Dashboard

### Erstellte Daten

Nach Onboarding-Abschluss:
1. **Company** wird erstellt
2. **User Profile** wird aktualisiert
3. **User Role** wird gesetzt
4. **Onboarding Data** wird gespeichert

## Nächste Schritte nach Onboarding

### 1. Gehaltsbänder definieren
Admin/HR-Manager können:
- Job-Profile erstellen
- Gehaltsbänder festlegen
- Qualifikationen pro Band definieren

### 2. Mitarbeiter hinzufügen
- Manuell anlegen
- CSV-Import (geplant)
- Zuweisung zu Gehaltsbändern

### 3. Mitarbeiter einladen
- E-Mail-Einladungen versenden
- Mitarbeiter können sich registrieren
- Zugriff auf ihre Gehaltsbänder
- Transparenz über Qualifikationen

## User Management (Roadmap)

### Admin-Funktionen
- ✅ Mitarbeiter anlegen
- ✅ Rollen zuweisen
- ✅ Gehaltsbänder verwalten
- 🔄 Mitarbeiter einladen (E-Mail)
- 🔄 Zugriffsrechte verwalten
- 🔄 Audit-Logs einsehen

### HR-Manager-Funktionen
- ✅ Mitarbeiter anlegen
- ✅ Gehaltsbänder verwalten
- ✅ Anfragen bearbeiten
- 🔄 Berichte erstellen

### Mitarbeiter-Funktionen
- ✅ Eigene Daten einsehen
- ✅ Gehaltsvergleich ansehen
- ✅ Auskunftsanfragen stellen
- 🔄 Qualifikationen einsehen

## Beratungsoptionen

### Self-Service
- Kostenlos
- Voller Plattform-Zugriff
- Dokumentation
- Community-Forum (geplant)

### Guided Onboarding
- Im Standard-Plan enthalten
- Video-Tutorials
- E-Mail-Support
- Schritt-für-Schritt-Guides

### Full-Service
- Ab 499€/Monat
- Persönlicher Berater
- Workshops
- Telefon-Support
- Prioritäts-Behandlung
- Individuelle Schulungen

## Migration bestehender Nutzer

Bestehende Nutzer ohne Onboarding-Daten:
- Werden beim nächsten Login zum Onboarding geleitet
- Können Onboarding überspringen (Admin-Option)
- Daten werden nachträglich erfasst

## Metriken & Analytics (geplant)

- Onboarding-Abschlussrate
- Durchschnittliche Dauer pro Schritt
- Beliebte Beratungsoptionen
- Abbruchpunkte identifizieren

## Testing

### Testszenarien
1. Neue Registrierung als Admin
2. Neue Registrierung als HR-Manager
3. Neue Registrierung als Employee
4. Onboarding-Abbruch und Fortsetzung
5. Beratungstermin-Anfrage

### Test-Accounts
```
Admin: admin@test.de / Test123!
HR: hr@test.de / Test123!
Employee: employee@test.de / Test123!
```

## Deployment

### Datenbank-Migration
```bash
# Migration ausführen
supabase db push

# Oder manuell
psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/migrations/20260114_create_onboarding_table.sql
```

### Environment Variables
Keine zusätzlichen Variablen erforderlich.

## Support & Dokumentation

- **Hilfe-Center**: `/help` (geplant)
- **Video-Tutorials**: `/tutorials` (geplant)
- **API-Docs**: `/docs/api` (geplant)

---

**Status**: ✅ Implementiert und einsatzbereit
**Version**: 1.0.0
**Letzte Aktualisierung**: 14.01.2026
