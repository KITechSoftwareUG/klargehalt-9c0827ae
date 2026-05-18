'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Download, Loader2, ShieldCheck, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * PrivacySettingsView — the "Datenschutz" tab.
 *
 * Owns the genuinely new, settings-scoped DSGVO data export. Account
 * deletion is a security-reviewed subsystem that lives on `main`
 * (DangerZoneCard + /api/account/* + lifecycle migration + the
 * guardOrgMember soft-lock). It is intentionally NOT re-ported here —
 * it unifies on the eventual merge into main. The deletion section
 * below is the merge slot: replace its body with <DangerZoneCard />
 * when this branch merges into main.
 */
export default function PrivacySettingsView() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/profiles/me/export');
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? 'Export fehlgeschlagen');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `klargehalt-meine-daten-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Datenexport heruntergeladen');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Export fehlgeschlagen';
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Daten &amp; Datenschutz
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ihre Rechte nach der DSGVO.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">
                Meine Daten herunterladen
              </CardTitle>
              <CardDescription className="mt-0.5">
                Auskunft &amp; Datenübertragbarkeit (DSGVO Art. 15 / 20) —
                Ihre Profil-, Mitgliedschafts- und Benachrichtigungsdaten als
                JSON.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-4 w-4" />
            )}
            Datenexport herunterladen
          </Button>
        </CardContent>
      </Card>

      {/* MERGE SLOT: replace this card's body with <DangerZoneCard /> when
          this branch merges into main (account-deletion subsystem). */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Konto löschen</CardTitle>
              <CardDescription className="mt-0.5">
                Recht auf Löschung (DSGVO Art. 17).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Compliance-Dokumentation (z. B. Entgeltentscheidungen,
            Audit-Trail) unterliegt gesetzlichen Aufbewahrungspflichten und
            kann nicht vollständig gelöscht werden. Personenbezogene
            Stammdaten werden bei einer Löschung pseudonymisiert.
          </p>
          <p className="text-sm text-muted-foreground">
            Für eine Konto- bzw. Mandantenlöschung wenden Sie sich bitte an:
          </p>
          <Button asChild variant="outline" size="sm">
            <a href="mailto:datenschutz@klargehalt.de?subject=Konto-L%C3%B6schung">
              <Mail className="mr-1.5 h-4 w-4" />
              datenschutz@klargehalt.de
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
