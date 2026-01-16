# 🚀 Onboarding-System - Quick Start

## ✅ Was wurde implementiert

### 1. **Onboarding-Flow** (`/onboarding`)
Ein 5-Schritte-Prozess für neue Geschäftsführer und HR-Manager:

**Schritt 1**: Rolle auswählen (Geschäftsführer/HR-Manager)  
**Schritt 2**: Mitarbeiteranzahl angeben  
**Schritt 3**: Beratungsoption wählen (Self-Service/Guided/Full-Service)  
**Schritt 4**: Unternehmensdaten eingeben  
**Schritt 5**: Zusammenfassung & Abschluss  

### 2. **Automatische Weiterleitung**
- **Admin/HR-Manager** → `/onboarding` nach Registrierung
- **Mitarbeiter** → `/dashboard` nach Registrierung

### 3. **Datenbank-Tabelle**
`onboarding_data` - Speichert Onboarding-Präferenzen

## 🎯 Wie es funktioniert

### Für Geschäftsführer/HR-Manager:

1. **Registrierung** auf `/auth`
   - Rolle: Administrator oder HR-Manager wählen
   - E-Mail, Passwort, Name, Firma eingeben

2. **Automatische Weiterleitung** zu `/onboarding`
   - 5 Schritte durchlaufen
   - Beratungsoption wählen
   - Unternehmensdaten vervollständigen

3. **Nach Abschluss**:
   - Firma wird in Datenbank erstellt
   - User-Profil wird aktualisiert
   - Weiterleitung zum Dashboard

### Für Mitarbeiter:

1. **Registrierung** auf `/auth`
   - Rolle: Mitarbeiter wählen

2. **Direkt zum Dashboard**
   - Kein Onboarding erforderlich
   - Warten auf Einladung vom Admin

## 📋 Nächste Schritte (Roadmap)

### Phase 1: ✅ Basis-Onboarding (Fertig)
- [x] 5-Schritte-Flow
- [x] Rollenauswahl
- [x] Beratungsoptionen
- [x] Datenbank-Integration

### Phase 2: 🔄 Erweiterte Funktionen (In Arbeit)
- [ ] E-Mail-Einladungen für Mitarbeiter
- [ ] CSV-Import für Mitarbeiter
- [ ] Beratungstermin-Buchung
- [ ] Video-Tutorials einbetten

### Phase 3: 📅 User Management (Geplant)
- [ ] Mitarbeiter-Einladungssystem
- [ ] Rollen- und Rechteverwaltung
- [ ] Team-Übersicht
- [ ] Aktivitäts-Logs

### Phase 4: 📊 Analytics & Reporting (Geplant)
- [ ] Onboarding-Metriken
- [ ] Abschlussraten
- [ ] User-Journey-Tracking

## 🛠️ Technische Details

### Neue Dateien:
```
app/onboarding/page.tsx                    # Onboarding-Seite
supabase/migrations/20260114_*.sql         # Datenbank-Migration
docs/ONBOARDING.md                         # Vollständige Dokumentation
```

### Geänderte Dateien:
```
app/auth/page.tsx                          # Weiterleitung nach Registrierung
```

### Datenbank-Schema:
```sql
CREATE TABLE onboarding_data (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  company_size TEXT,
  consulting_option TEXT,
  completed_at TIMESTAMPTZ
);
```

## 🧪 Testen

### Manueller Test:

1. **Starte den Dev-Server**:
   ```bash
   npm run dev
   ```

2. **Öffne** `http://localhost:3000/auth`

3. **Registriere dich** als:
   - **Admin**: Wähle "Administrator" → Wirst zu `/onboarding` weitergeleitet
   - **HR-Manager**: Wähle "HR-Manager" → Wirst zu `/onboarding` weitergeleitet
   - **Mitarbeiter**: Wähle "Mitarbeiter" → Wirst zu `/dashboard` weitergeleitet

4. **Durchlaufe das Onboarding**:
   - Schritt 1: Rolle bestätigen
   - Schritt 2: Mitarbeiteranzahl wählen
   - Schritt 3: Beratungsoption wählen
   - Schritt 4: Unternehmensdaten eingeben
   - Schritt 5: Abschließen

5. **Überprüfe**:
   - Dashboard wird geladen
   - Firma ist erstellt
   - Profil ist vollständig

### Datenbank-Migration ausführen:

```bash
# Wenn du Supabase CLI verwendest
supabase db push

# Oder manuell in Supabase Dashboard
# SQL Editor → Neue Query → Migration-Datei einfügen → Run
```

## 🎨 UI/UX Features

- **Progress Bar**: Zeigt Fortschritt durch die 5 Schritte
- **Zurück-Button**: Navigation zu vorherigen Schritten
- **Validierung**: Nur vollständige Schritte erlauben Weiter
- **Icons**: Visuelle Unterstützung für jeden Schritt
- **Responsive**: Funktioniert auf Desktop und Mobile
- **Zusammenfassung**: Überprüfung vor Abschluss

## 💡 Beratungsoptionen

### Self-Service (Kostenlos)
- Eigenständige Nutzung
- Dokumentation verfügbar
- Community-Support

### Guided Onboarding (Standard)
- Video-Tutorials
- E-Mail-Support
- Schritt-für-Schritt-Guides

### Full-Service (Premium - 499€/Monat)
- Persönlicher Berater
- Workshops
- Telefon-Support
- Prioritäts-Behandlung

## 📞 Support

Bei Fragen oder Problemen:
- **Dokumentation**: `docs/ONBOARDING.md`
- **Code**: `app/onboarding/page.tsx`
- **Migration**: `supabase/migrations/20260114_create_onboarding_table.sql`

## ✨ Highlights

✅ **Nahtlose Integration** - Automatische Weiterleitung nach Registrierung  
✅ **Benutzerfreundlich** - Klarer 5-Schritte-Prozess  
✅ **Flexibel** - Verschiedene Beratungsoptionen  
✅ **Skalierbar** - Vorbereitet für zukünftige Features  
✅ **Datengetrieben** - Alle Präferenzen werden gespeichert  

---

**Status**: ✅ Einsatzbereit  
**Version**: 1.0.0  
**Datum**: 14.01.2026  
