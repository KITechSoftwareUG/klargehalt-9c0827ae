# 🎨 Clerk Branding & OAuth-Anpassung

## Problem
Wenn User sich mit Google einloggen, erscheint "Clerk" statt "KlarGehalt" im OAuth-Popup.

## Lösung: Clerk Dashboard Branding

### Schritt 1: Clerk Dashboard öffnen
1. Gehe zu: https://dashboard.clerk.com
2. Wähle dein Projekt aus
3. Gehe zu **Customization** → **Branding**

### Schritt 2: Application Name ändern

```
┌─────────────────────────────────────┐
│  Branding Settings                  │
├─────────────────────────────────────┤
│                                     │
│  Application Name                   │
│  ┌───────────────────────────────┐ │
│  │ KlarGehalt                    │ │
│  └───────────────────────────────┘ │
│                                     │
│  Application Logo                   │
│  [Upload Logo]                      │
│                                     │
└─────────────────────────────────────┘
```

**Wichtig:**
- **Application Name:** `KlarGehalt`
- **Support Email:** `support@klargehalt.de`
- **Logo:** Lade dein KlarGehalt-Logo hoch

### Schritt 3: Logo hochladen

**Empfohlene Größen:**
- **Square Logo:** 512x512px (PNG mit transparentem Hintergrund)
- **Favicon:** 32x32px

**Wo wird es verwendet:**
- ✅ OAuth-Popup (Google, Microsoft, etc.)
- ✅ Email-Vorlagen
- ✅ Clerk-Komponenten
- ✅ Account Portal

### Schritt 4: Theme anpassen (Optional)

```typescript
// In deinem Code (app/layout.tsx)
<ClerkProvider
  appearance={{
    variables: {
      colorPrimary: '#0F172A',  // Deine Primärfarbe
    },
  }}
>
```

**Im Clerk Dashboard:**
- Gehe zu **Customization** → **Theme**
- Wähle "Light" oder "Dark"
- Passe Farben an (optional)

### Schritt 5: OAuth-Provider konfigurieren

#### Google OAuth einrichten:

1. **Clerk Dashboard** → **User & Authentication** → **Social Connections**
2. **Google** aktivieren
3. Wähle eine der Optionen:

**Option A: Clerk's Development Keys (Schnell)**
```
✅ Use Clerk's development keys
- Schnell für Testing
- Zeigt "Clerk" im OAuth
- Nicht für Production!
```

**Option B: Eigene Google OAuth App (Production)**
```
✅ Use custom credentials
- Zeigt "KlarGehalt" im OAuth
- Volle Kontrolle
- Für Production empfohlen
```

### Schritt 6: Eigene Google OAuth App erstellen

#### 1. Google Cloud Console
https://console.cloud.google.com

#### 2. Neues Projekt erstellen
```
Projekt-Name: KlarGehalt
```

#### 3. OAuth Consent Screen konfigurieren
```
User Type: External
App Name: KlarGehalt
User Support Email: support@klargehalt.de
App Logo: [Dein Logo hochladen]
Application Homepage: https://klargehalt.de
Privacy Policy: https://klargehalt.de/datenschutz
Terms of Service: https://klargehalt.de/agb
```

#### 4. OAuth 2.0 Client ID erstellen
```
Application Type: Web Application
Name: KlarGehalt Production

Authorized JavaScript origins:
- https://klargehalt.de
- http://localhost:3000 (für Development)

Authorized redirect URIs:
- https://accounts.clerk.dev/v1/oauth_callback
- https://YOUR_CLERK_FRONTEND_API/v1/oauth_callback
```

**Clerk Frontend API findest du:**
- Clerk Dashboard → API Keys → Frontend API

#### 5. Credentials in Clerk eintragen
```
Client ID: [Deine Google Client ID]
Client Secret: [Dein Google Client Secret]
```

### Schritt 7: Testen

1. **Development:**
   - Gehe zu `/sign-in`
   - Klicke "Mit Google anmelden"
   - ✅ Sollte jetzt "KlarGehalt" zeigen

2. **Production:**
   - Deploye deine App
   - Teste OAuth-Flow
   - Verifiziere Branding

## Vorher vs. Nachher

### ❌ Vorher (Clerk Development Keys)
```
┌─────────────────────────────┐
│  Mit Google anmelden        │
├─────────────────────────────┤
│                             │
│  Clerk möchte auf dein      │
│  Google-Konto zugreifen     │
│                             │
│  [Zulassen] [Ablehnen]      │
└─────────────────────────────┘
```

### ✅ Nachher (Eigene OAuth App)
```
┌─────────────────────────────┐
│  Mit Google anmelden        │
├─────────────────────────────┤
│                             │
│  KlarGehalt möchte auf dein │
│  Google-Konto zugreifen     │
│                             │
│  🛡️ [Dein Logo]             │
│                             │
│  [Zulassen] [Ablehnen]      │
└─────────────────────────────┘
```

## Weitere Anpassungen

### Email-Templates
**Clerk Dashboard** → **Customization** → **Emails**

```
From Name: KlarGehalt
From Email: noreply@klargehalt.de
Reply-To: support@klargehalt.de
```

### Account Portal
**Clerk Dashboard** → **Customization** → **Account Portal**

```
✅ Custom Domain: accounts.klargehalt.de (optional)
✅ Custom Branding
✅ Custom Theme
```

## Checkliste

- [ ] Application Name auf "KlarGehalt" geändert
- [ ] Logo hochgeladen (512x512px)
- [ ] Favicon hochgeladen (32x32px)
- [ ] Support Email gesetzt
- [ ] Google OAuth App erstellt
- [ ] OAuth Consent Screen konfiguriert
- [ ] Client ID & Secret in Clerk eingetragen
- [ ] Redirect URIs konfiguriert
- [ ] Email-Templates angepasst
- [ ] Testing durchgeführt

## Wichtige Links

- **Clerk Dashboard:** https://dashboard.clerk.com
- **Google Cloud Console:** https://console.cloud.google.com
- **Clerk Docs - Branding:** https://clerk.com/docs/customization/overview
- **Clerk Docs - OAuth:** https://clerk.com/docs/authentication/social-connections/oauth

## Tipps

1. **Development vs. Production:**
   - Development: Clerk's Keys OK
   - Production: Eigene OAuth App PFLICHT

2. **Logo-Anforderungen:**
   - PNG mit transparentem Hintergrund
   - Quadratisch (1:1 Ratio)
   - Mindestens 512x512px
   - Maximal 5MB

3. **Domain Verification:**
   - Für Production: Domain in Google verifizieren
   - Für Clerk: Custom Domain optional

4. **Testing:**
   - Teste in Inkognito-Modus
   - Teste verschiedene Browser
   - Teste Mobile

---

**Nach diesen Schritten zeigt das Google OAuth-Popup "KlarGehalt" statt "Clerk"! 🎉**
