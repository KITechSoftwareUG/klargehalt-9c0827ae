'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useRoleAccess } from '@/components/RoleGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Owner-only "Gefahrenzone": schedule irreversible tenant deletion.
 * Real enforcement is server-side (api-guard + RLS) — this is the UX entry.
 * Wording per law.md §7 (no "rechtssicher"/"Garantie").
 */
export default function DangerZoneCard() {
  const isOwner = useRoleAccess('owner');
  const { company, loading } = useCompany();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [ackDataLoss, setAckDataLoss] = useState(false);
  const [ackIrreversible, setAckIrreversible] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Tenant deletion is the owner's prerogative only (a non-owner admin must not
  // be able to close the company). Hidden entirely for non-owners.
  if (!isOwner) return null;

  if (loading || !company) {
    return <Skeleton className="h-40 w-full" />;
  }

  const companyName = company.name ?? '';
  const nameMatches =
    confirmName.trim().toLowerCase() === companyName.trim().toLowerCase() &&
    companyName.trim().length > 0;
  const canSubmit = nameMatches && ackDataLoss && ackIrreversible && !submitting;

  const reset = () => {
    setConfirmName('');
    setAckDataLoss(false);
    setAckIrreversible(false);
    setReason('');
  };

  const handleDelete = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmCompanyName: confirmName.trim(),
          ackDataLoss: true,
          ackIrreversible: true,
          reason: reason.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error ?? 'Löschung konnte nicht vorgemerkt werden.');
      }
      toast.success('Konto zur Löschung vorgemerkt.');
      setOpen(false);
      router.replace('/konto-gesperrt');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.';
      toast.error(message);
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base text-destructive">Konto löschen</CardTitle>
            <CardDescription className="mt-0.5">
              Beendet das Abonnement und löscht das Konto unwiderruflich.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive/90">
          <p className="font-medium">Was passiert</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Das Abonnement wird zum Ende der Abrechnungsperiode beendet.</li>
            <li>
              30 Tage lang reaktivierbar — danach werden personenbezogene Daten
              entfernt bzw. pseudonymisiert und der Zugang gelöscht.
            </li>
            <li>
              Aus gesetzlichen Aufbewahrungsgründen (EU-Richtlinie 2023/970,
              DSGVO Art. 17 Abs. 3 lit. b) bleibt die Compliance-Dokumentation
              (Begründungs-Trail, Audit-Protokoll) in anonymisierter Form
              erhalten.
            </li>
          </ul>
        </div>

        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-1.5 h-4 w-4" />
              Konto löschen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Konto „{companyName}" löschen</DialogTitle>
              <DialogDescription>
                Diese Aktion markiert das Konto zur Löschung. Bestätigen Sie zur
                Sicherheit den Firmennamen.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="confirm-name">
                  Firmenname eingeben: <strong>{companyName}</strong>
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={companyName}
                  autoComplete="off"
                />
              </div>

              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={ackDataLoss}
                  onCheckedChange={(v) => setAckDataLoss(v === true)}
                  className="mt-0.5"
                />
                <span className="text-muted-foreground">
                  Mir ist bewusst, dass das Abonnement endet und Mitarbeiter-,
                  Struktur- und Analysedaten entfernt werden.
                </span>
              </label>

              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={ackIrreversible}
                  onCheckedChange={(v) => setAckIrreversible(v === true)}
                  className="mt-0.5"
                />
                <span className="text-muted-foreground">
                  Mir ist bewusst, dass die Löschung nach 30 Tagen endgültig und
                  nicht umkehrbar ist.
                </span>
              </label>

              <div className="grid gap-2">
                <Label htmlFor="reason" className="text-muted-foreground">
                  Grund (optional)
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Hilft uns, das Produkt zu verbessern."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-4 w-4" />
                )}
                Unwiderruflich löschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
