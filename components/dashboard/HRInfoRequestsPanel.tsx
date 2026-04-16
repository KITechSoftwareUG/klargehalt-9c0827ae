'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Inbox,
} from 'lucide-react';
import {
  useInfoRequests,
  REQUEST_TYPES,
  InfoRequestType,
  getDaysUntilDeadline,
  getDeadlineStatus,
} from '@/hooks/useInfoRequests';
import type { InfoRequest } from '@/hooks/useInfoRequests';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDateDE(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE');
}

function DeadlineBadge({ deadline_at }: { deadline_at: string | null }) {
  if (!deadline_at) return null;
  const days = getDaysUntilDeadline(deadline_at);
  const status = getDeadlineStatus(deadline_at);
  const colorClass =
    status === 'overdue'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      : status === 'warning'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';

  return (
    <Badge className={colorClass}>
      {formatDateDE(deadline_at)}
    </Badge>
  );
}

function RemainingCell({ deadline_at }: { deadline_at: string | null }) {
  if (!deadline_at) return <span className="text-muted-foreground">—</span>;
  const days = getDaysUntilDeadline(deadline_at);
  if (days === null) return <span className="text-muted-foreground">—</span>;
  if (days < 0) {
    return <span className="font-semibold text-red-600 dark:text-red-400">ÜBERFÄLLIG</span>;
  }
  const color =
    days <= 14 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400';
  return <span className={`font-medium ${color}`}>{days}d</span>;
}

const STATUS_LABELS: Record<InfoRequest['status'], string> = {
  pending: 'Ausstehend',
  fulfilled: 'Beantwortet',
  declined: 'Abgelehnt',
};

const STATUS_COLORS: Record<InfoRequest['status'], string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  fulfilled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ── main component ────────────────────────────────────────────────────────────

export default function HRInfoRequestsPanel() {
  const { requests, loading, fetchRequests, fulfillRequest, declineRequest } = useInfoRequests();

  const [pendingRequests, setPendingRequests] = useState<InfoRequest[]>([]);
  const [answerTarget, setAnswerTarget] = useState<InfoRequest | null>(null);
  const [declineTarget, setDeclineTarget] = useState<InfoRequest | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [answerNote, setAnswerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Derive pending from the shared hook state
  useEffect(() => {
    setPendingRequests(requests.filter((r) => r.status === 'pending'));
  }, [requests]);

  const refreshAll = useCallback(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Stats
  const overdue = pendingRequests.filter((r) => getDeadlineStatus(r.deadline_at) === 'overdue');
  const dueSoon = pendingRequests.filter((r) => getDeadlineStatus(r.deadline_at) === 'warning');

  // Handle answer submit
  const handleFulfill = async () => {
    if (!answerTarget) return;
    setSubmitting(true);
    const ok = await fulfillRequest(answerTarget.id, { hr_note: answerNote });
    if (ok) {
      setAnswerTarget(null);
      setAnswerNote('');
      refreshAll();
    }
    setSubmitting(false);
  };

  // Handle decline submit
  const handleDecline = async () => {
    if (!declineTarget) return;
    setSubmitting(true);
    const ok = await declineRequest(declineTarget.id, declineReason);
    if (ok) {
      setDeclineTarget(null);
      setDeclineReason('');
      refreshAll();
    }
    setSubmitting(false);
  };

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Auskunftsanfragen (Art. 7)
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Antwortfrist: 60 Tage</p>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-3">
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-sm px-3 py-1">
          <Clock className="h-3.5 w-3.5 mr-1" />
          {pendingRequests.length} ausstehend
        </Badge>
        {overdue.length > 0 && (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-sm px-3 py-1">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            {overdue.length} überfällig
          </Badge>
        )}
        {dueSoon.length > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-sm px-3 py-1">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {dueSoon.length} diese Woche fällig
          </Badge>
        )}
      </div>

      {/* Legal hint */}
      <Alert className="border-primary/30 bg-primary/5">
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          Gemäß Art. 7 EU-Richtlinie 2023/970 müssen Auskunftsanfragen innerhalb von 60 Tagen
          beantwortet werden.
        </AlertDescription>
      </Alert>

      {/* Request list */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Keine offenen Anfragen</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alle Anfragen</CardTitle>
            <CardDescription>Sortiert nach Fälligkeit</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Anfrage-Typ</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Eingegangen</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Frist</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Verbleibend</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const typeLabel =
                      REQUEST_TYPES[req.request_type as InfoRequestType]?.label ?? req.request_type;
                    return (
                      <tr key={req.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{typeLabel}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDateDE(req.created_at)}</td>
                        <td className="px-4 py-3">
                          <DeadlineBadge deadline_at={req.deadline_at} />
                        </td>
                        <td className="px-4 py-3">
                          {req.status === 'pending' ? (
                            <RemainingCell deadline_at={req.deadline_at} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={STATUS_COLORS[req.status]}>
                            {STATUS_LABELS[req.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {req.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAnswerTarget(req)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Beantworten
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeclineTarget(req)}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Ablehnen
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Answer dialog */}
      <Dialog open={answerTarget !== null} onOpenChange={() => { setAnswerTarget(null); setAnswerNote(''); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Anfrage beantworten</DialogTitle>
            <DialogDescription>
              {answerTarget && (
                <>
                  Typ:{' '}
                  <strong>
                    {REQUEST_TYPES[answerTarget.request_type as InfoRequestType]?.label ??
                      answerTarget.request_type}
                  </strong>
                  {answerTarget.deadline_at && (
                    <>
                      {' '}· Frist:{' '}
                      <span className={getDeadlineStatus(answerTarget.deadline_at) === 'overdue' ? 'text-red-600 font-semibold' : ''}>
                        {formatDateDE(answerTarget.deadline_at)}
                      </span>
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Alle übermittelten Daten werden anonymisiert und entsprechen den EU-Vorgaben.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="answer-note">Antwort / Hinweis (optional)</Label>
              <Textarea
                id="answer-note"
                placeholder="Ergänzende Informationen für den Mitarbeiter..."
                value={answerNote}
                onChange={(e) => setAnswerNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAnswerTarget(null); setAnswerNote(''); }}>
              Abbrechen
            </Button>
            <Button onClick={handleFulfill} disabled={submitting}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {submitting ? 'Wird gespeichert...' : 'Anfrage beantworten'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline dialog */}
      <Dialog open={declineTarget !== null} onOpenChange={() => { setDeclineTarget(null); setDeclineReason(''); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Anfrage ablehnen</DialogTitle>
            <DialogDescription>
              {declineTarget && (
                <>
                  Typ:{' '}
                  <strong>
                    {REQUEST_TYPES[declineTarget.request_type as InfoRequestType]?.label ??
                      declineTarget.request_type}
                  </strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Alert className="border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                Eine Ablehnung muss begründet werden. Der Mitarbeiter erhält die Begründung.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="decline-reason">Begründung *</Label>
              <Textarea
                id="decline-reason"
                placeholder="Bitte geben Sie eine Begründung für die Ablehnung an..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeclineTarget(null); setDeclineReason(''); }}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={submitting || declineReason.trim().length === 0}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {submitting ? 'Wird gespeichert...' : 'Anfrage ablehnen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
