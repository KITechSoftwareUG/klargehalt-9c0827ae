'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useRightsNotifications } from '@/hooks/useRightsNotifications';

const NOTIFICATION_TEXT =
  `Gemäß EU-Richtlinie 2023/970 (Entgelttransparenzrichtlinie) haben Sie das Recht:\n` +
  `• Informationen über Ihr individuelles Gehaltsniveau zu erhalten\n` +
  `• Durchschnittliche Gehaltsdaten nach Geschlecht für gleichwertige Tätigkeiten anzufordern\n` +
  `• Den Gender Pay Gap in Ihrer Entgeltkategorie zu erfahren\n\n` +
  `Um Ihr Auskunftsrecht auszuüben, wenden Sie sich an die HR-Abteilung oder nutzen Sie das Mitarbeiterportal.`;

type DeliveryMethod = 'in_app' | 'email' | 'both';

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string }[] = [
  { value: 'in_app', label: 'In-App' },
  { value: 'email', label: 'E-Mail' },
  { value: 'both', label: 'Beides' },
];

function formatDateDE(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function RightsNotificationsPanel() {
  const { notifications, loading, currentYearNotification, hasNotifiedThisYear, sendNotification } =
    useRightsNotifications();

  const currentYear = new Date().getFullYear();
  const [textExpanded, setTextExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('in_app');
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async () => {
    const count = parseInt(recipientCount, 10);
    if (isNaN(count) || count < 1) return;
    setSubmitting(true);
    const ok = await sendNotification(count, deliveryMethod);
    if (ok) {
      setDialogOpen(false);
      setRecipientCount('');
      setDeliveryMethod('in_app');
    }
    setSubmitting(false);
  };

  const pastNotifications = notifications.filter((n) => n.notification_year !== currentYear);

  if (loading && notifications.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          Jährliche Mitarbeiterinformation (Art. 7)
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Informieren Sie alle Mitarbeiter einmal jährlich über ihre Auskunftsrechte.
        </p>
      </div>

      {/* Status card */}
      <Card className={hasNotifiedThisYear ? 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' : 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10'}>
        <CardContent className="py-6">
          {hasNotifiedThisYear && currentYearNotification ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 shrink-0" />
                <div>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                    Benachrichtigung {currentYear} gesendet ✓
                  </p>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-0.5">
                    Gesendet am {formatDateDE(currentYearNotification.sent_at)} ·{' '}
                    {currentYearNotification.recipient_count} Empfänger ·{' '}
                    {DELIVERY_OPTIONS.find((o) => o.value === currentYearNotification.delivery_method)?.label}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 self-start sm:self-auto">
                Erledigt {currentYear}
              </Badge>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">
                    Noch nicht gesendet für {currentYear}
                  </p>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                    Informieren Sie jetzt alle Mitarbeiter über ihre Auskunftsrechte.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setDialogOpen(true)}
                className="self-start sm:self-auto shrink-0"
              >
                <Send className="h-4 w-4 mr-2" />
                Jetzt senden
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legal text preview (collapsible) */}
      <Card>
        <CardHeader className="pb-2">
          <button
            type="button"
            className="flex items-center justify-between w-full text-left"
            onClick={() => setTextExpanded((v) => !v)}
          >
            <CardTitle className="text-base">Vorschau: Pflichttext (Art. 7)</CardTitle>
            {textExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {textExpanded && (
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
              {NOTIFICATION_TEXT}
            </pre>
          </CardContent>
        )}
      </Card>

      {/* Past notifications */}
      {pastNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vergangene Benachrichtigungen</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Jahr</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Gesendet am</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empfänger</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Methode</th>
                </tr>
              </thead>
              <tbody>
                {pastNotifications.map((n) => (
                  <tr key={n.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{n.notification_year}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateDE(n.sent_at)}</td>
                    <td className="px-4 py-3">{n.recipient_count}</td>
                    <td className="px-4 py-3">
                      {DELIVERY_OPTIONS.find((o) => o.value === n.delivery_method)?.label ?? n.delivery_method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Legal note */}
      <Alert className="border-muted">
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription className="text-muted-foreground text-xs">
          Die jährliche Information aller Mitarbeiter ist gemäß Art. 7 EU-Richtlinie 2023/970
          verpflichtend.
        </AlertDescription>
      </Alert>

      {/* Send confirmation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Jährliche Benachrichtigung senden</DialogTitle>
            <DialogDescription>
              Mitarbeiter über ihre Auskunftsrechte gemäß Art. 7 informieren ({currentYear})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Notification text preview */}
            <div className="rounded-md border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">
                {NOTIFICATION_TEXT}
              </pre>
            </div>

            {/* Recipient count */}
            <div className="space-y-2">
              <Label htmlFor="recipient-count">Anzahl Empfänger</Label>
              <Input
                id="recipient-count"
                type="number"
                min={1}
                placeholder="z.B. 42"
                value={recipientCount}
                onChange={(e) => setRecipientCount(e.target.value)}
              />
            </div>

            {/* Delivery method */}
            <div className="space-y-2">
              <Label>Versandmethode</Label>
              <div className="flex gap-2">
                {DELIVERY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDeliveryMethod(opt.value)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      deliveryMethod === opt.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSend}
              disabled={submitting || !recipientCount || parseInt(recipientCount, 10) < 1}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Wird gesendet...' : 'Bestätigen & senden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
