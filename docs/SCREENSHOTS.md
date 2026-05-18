# Marketing-Screenshots — Anleitung

Die Funktionen-Seite (`/funktionen` auf `klargehalt.de`) zeigt pro Modul einen
Bild-Slot im Seitenverhältnis **4:3**. Solange kein Bild hinterlegt ist, wird
automatisch ein dezenter Platzhalter („Screenshot folgt") angezeigt — **kein
kaputtes Bild, kein Layout-Sprung**.

Du musst die Screenshots also nur erstellen und an die richtige Stelle legen.
Sobald die Datei da ist und neu deployed wird, erscheint sie automatisch.

---

## Was du tun musst

1. Screenshot je Modul erstellen (siehe Tabelle unten).
2. Datei **exakt so benennen** wie in der Spalte „Dateiname".
3. Datei ablegen unter: **`public/screenshots/`** (im Repo-Root, der Ordner existiert bereits).
4. Committen + deployen (Marketing-App neu bauen lassen) — danach ist das Bild live.

> Der Code prüft beim Build, welche Dateien in `public/screenshots/` liegen.
> Fehlt eine Datei → Platzhalter. Ist sie da → echtes Bild. Ein erneutes
> Deploy/Rebuild der Marketing-App ist nötig, damit neue Bilder erkannt werden.

---

## Asset-Spezifikation

| # | Modul (auf /funktionen) | Dateiname | Maße | Format |
|---|---|---|---|---|
| 01 | Gehaltsstrukturen erfassen | `feat-gehaltsstrukturen.png` | 1600 × 1200 px (4:3) | PNG |
| 02 | Pay-Gap automatisch berechnen | `feat-pay-gap.png` | 1600 × 1200 px (4:3) | PNG |
| 03 | Rollen und Zugriffsrechte | `feat-rollen.png` | 1600 × 1200 px (4:3) | PNG |
| 04 | HR-Auskunftsprozess | `feat-hr-auskunft.png` | 1600 × 1200 px (4:3) | PNG |
| 05 | Audit-Trail | `feat-audit-trail.png` | 1600 × 1200 px (4:3) | PNG |
| 06 | EU-Hosting & Verschlüsselung | `feat-eu-hosting.png` | 1600 × 1200 px (4:3) | PNG |

### Vorgaben

- **Seitenverhältnis exakt 4:3.** Das Bild wird mit `object-cover` eingepasst —
  abweichende Verhältnisse werden beschnitten. 1600 × 1200 px ist die Empfehlung
  (scharf auf Retina/4K). Minimum sinnvoll: 1200 × 900 px.
- **Format:** PNG (verlustfrei, gut für UI-Screenshots). JPG nur falls Dateigröße
  zum Problem wird — dann denselben Basisnamen mit `.jpg` und kurz Bescheid geben,
  damit der Pfad im Code (`feat-*.png`) angepasst wird.
- **Dateigröße:** möglichst < 500 KB pro Bild (vorher durch z. B. TinyPNG jagen).
- **Inhalt:** echter App-Screenshot des jeweiligen Moduls, ohne echte
  Mitarbeiter-/Gehaltsdaten (Demo-/Dummy-Daten verwenden — DSGVO).
- **Keine PII** im Bild (keine echten Namen, E-Mails, Gehälter, Geschlecht).

---

## Ablageort (Beispiel)

```
public/
└── screenshots/
    ├── .gitkeep
    ├── feat-gehaltsstrukturen.png
    ├── feat-pay-gap.png
    ├── feat-rollen.png
    ├── feat-hr-auskunft.png
    ├── feat-audit-trail.png
    └── feat-eu-hosting.png
```

Du kannst auch nur einzelne Bilder liefern — die übrigen Module zeigen so lange
weiter den Platzhalter.
