'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Scale,
  Shield,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Plus,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  useLawyerReviews,
  SCOPE_TYPE_LABELS,
  VERDICT_LABELS,
  VERDICT_COLORS,
} from '@/hooks/useLawyerReviews';
import type {
  LawyerReview,
  ReviewScopeType,
  ReviewVerdict,
  CreateLawyerReviewInput,
} from '@/hooks/useLawyerReviews';

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getVerdictIcon(verdict: ReviewVerdict) {
  switch (verdict) {
    case 'approved':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case 'needs_remediation':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case 'compliant_with_notes':
      return <FileText className="h-4 w-4 text-blue-600" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-600" />;
  }
}

// ============================================================================
// CREATE REVIEW DIALOG
// ============================================================================

interface CreateReviewDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateLawyerReviewInput) => Promise<LawyerReview | null>;
}

function CreateReviewDialog({ open, onClose, onSubmit }: CreateReviewDialogProps) {
  const [scopeType, setScopeType] = useState<ReviewScopeType>('pay_gap_report');
  const [scopeLabel, setScopeLabel] = useState('');
  const [verdict, setVerdict] = useState<ReviewVerdict>('approved');
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      scope_type: scopeType,
      scope_label: scopeLabel.trim() || undefined,
      verdict,
      notes: notes.trim() || undefined,
      recommendations: recommendations.trim() || undefined,
      review_period_start: periodStart || undefined,
      review_period_end: periodEnd || undefined,
    });
    setSubmitting(false);
    // Reset
    setScopeType('pay_gap_report');
    setScopeLabel('');
    setVerdict('approved');
    setNotes('');
    setRecommendations('');
    setPeriodStart('');
    setPeriodEnd('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Rechtliche Bewertung erstellen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Bewertungsbereich</Label>
            <Select value={scopeType} onValueChange={(v) => setScopeType(v as ReviewScopeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(SCOPE_TYPE_LABELS) as [ReviewScopeType, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Bezeichnung (optional)</Label>
            <Input
              value={scopeLabel}
              onChange={(e) => setScopeLabel(e.target.value)}
              placeholder="z.B. Q1 2026 Pay-Gap-Analyse"
            />
          </div>

          <div className="space-y-1">
            <Label>Ergebnis</Label>
            <Select value={verdict} onValueChange={(v) => setVerdict(v as ReviewVerdict)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(VERDICT_LABELS) as [ReviewVerdict, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Zeitraum von</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Zeitraum bis</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Anmerkungen</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Rechtliche Anmerkungen zur Bewertung..."
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <Label>Empfehlungen</Label>
            <Textarea
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Handlungsempfehlungen..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Wird erstellt...' : 'Bewertung abgeben'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// REVIEW CARD
// ============================================================================

function ReviewCard({ review }: { review: LawyerReview }) {
  const verdictColor = VERDICT_COLORS[review.verdict];

  return (
    <Card className="border-border/50">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {getVerdictIcon(review.verdict)}
              <span className="font-medium text-sm">
                {SCOPE_TYPE_LABELS[review.scope_type]}
              </span>
              {review.scope_label && (
                <span className="text-sm text-muted-foreground">
                  — {review.scope_label}
                </span>
              )}
            </div>
            <Badge variant="outline" className={`text-xs ${verdictColor}`}>
              {VERDICT_LABELS[review.verdict]}
            </Badge>
            {review.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">{review.notes}</p>
            )}
            {review.recommendations && (
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                Empfehlung: {review.recommendations}
              </p>
            )}
          </div>
          <div className="text-right shrink-0 space-y-1">
            <p className="text-xs text-muted-foreground">
              {formatDate(review.signed_at)}
            </p>
            <p className="text-xs text-muted-foreground">
              {review.reviewed_by_name}
            </p>
          </div>
        </div>
        {(review.review_period_start || review.review_period_end) && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Zeitraum: {review.review_period_start ? formatDate(review.review_period_start) : '—'} bis{' '}
            {review.review_period_end ? formatDate(review.review_period_end) : '—'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LawyerDashboard() {
  const { reviews, loading, createReview } = useLawyerReviews();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Stats
  const totalReviews = reviews.length;
  const approvedCount = reviews.filter((r) => r.verdict === 'approved').length;
  const remediationCount = reviews.filter((r) => r.verdict === 'needs_remediation').length;
  const rejectedCount = reviews.filter((r) => r.verdict === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Scale className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Rechtliche Bewertungen</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Rechtliche Compliance-Bewertungen und Stellungnahmen zu Entgelttransparenz-Berichten.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Neue Bewertung
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-primary/10">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReviews}</p>
                <p className="text-xs text-muted-foreground">Bewertungen gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Genehmigt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{remediationCount}</p>
                <p className="text-xs text-muted-foreground">Nachbesserung</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Abgelehnt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">Immutable Legal Reviews</p>
              <p className="mt-1 text-blue-800/80">
                Jede Bewertung wird unveränderlich gespeichert und dient als rechtsverbindliche
                Stellungnahme. Eingereichte Bewertungen können nicht bearbeitet oder gelöscht werden.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review list */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Scale className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Noch keine rechtlichen Bewertungen vorhanden.
            </p>
            <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Erste Bewertung erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateReviewDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={createReview}
      />
    </div>
  );
}
