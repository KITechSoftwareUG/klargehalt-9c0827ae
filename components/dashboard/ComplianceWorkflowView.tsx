'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Scale,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Plus,
  FileText,
  ChevronRight,
  RotateCcw,
  Award,
  ArrowRight,
} from 'lucide-react';
import { useComplianceAssessments } from '@/hooks/useComplianceAssessments';
import { useAuth } from '@/hooks/useAuth';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  VALID_TRANSITIONS,
  type ComplianceAssessment,
  type AssessmentDetail,
  type ComplianceAssessmentStatus,
} from '@/lib/types/compliance-workflow';

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SECTION_LABELS: Record<string, string> = {
  pay_bands: 'Gehaltsbaender',
  gap_analysis: 'Gap-Analyse',
  job_profiles: 'Job-Profile',
  salary_decisions: 'Gehaltsentscheidungen',
  general: 'Allgemein',
};

// ============================================================================
// STATS ROW
// ============================================================================

interface StatsRowProps {
  assessments: ComplianceAssessment[];
}

function StatsRow({ assessments }: StatsRowProps) {
  const active = assessments.filter(
    (a) =>
      a.status !== 'CERTIFIED_SNAPSHOT' &&
      a.status !== 'EXPIRED' &&
      a.status !== 'VALIDATED',
  ).length;
  const certified = assessments.filter(
    (a) => a.status === 'CERTIFIED_SNAPSHOT',
  ).length;
  const changesRequested = assessments.filter(
    (a) => a.status === 'CHANGES_REQUESTED',
  ).length;
  const expired = assessments.filter((a) => a.status === 'EXPIRED').length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{active}</p>
              <p className="text-xs text-muted-foreground">Aktive Pruefungen</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <Award className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{certified}</p>
              <p className="text-xs text-muted-foreground">Zertifiziert</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{changesRequested}</p>
              <p className="text-xs text-muted-foreground">Korrekturen</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gray-100 p-2">
              <XCircle className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{expired}</p>
              <p className="text-xs text-muted-foreground">Abgelaufen</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// ASSESSMENT LIST CARD
// ============================================================================

interface AssessmentListCardProps {
  assessment: ComplianceAssessment;
  isSelected: boolean;
  onClick: () => void;
}

function AssessmentListCard({
  assessment,
  isSelected,
  onClick,
}: AssessmentListCardProps) {
  const title = assessment.title ?? 'Compliance-Pruefung';
  const hasLawyer = !!assessment.lawyer_id;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-4 transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-white hover:border-primary/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-semibold leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(assessment.period_from)} – {formatDate(assessment.period_to)}
          </p>
          {hasLawyer && (
            <p className="flex items-center gap-1 text-xs text-blue-600">
              <Scale className="h-3 w-3" />
              Anwalt zugewiesen
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge
            variant="outline"
            className={`text-xs ${STATUS_COLORS[assessment.status]}`}
          >
            {STATUS_LABELS[assessment.status]}
          </Badge>
          {isSelected && (
            <ChevronRight className="h-3.5 w-3.5 text-primary" />
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// STATUS TIMELINE
// ============================================================================

interface StatusTimelineProps {
  detail: AssessmentDetail;
}

function StatusTimeline({ detail }: StatusTimelineProps) {
  if (detail.transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Noch keine Statuswechsel aufgezeichnet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {[...detail.transitions]
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
        .map((t, idx) => (
          <div key={t.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  idx === detail.transitions.length - 1
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                {idx + 1}
              </div>
              {idx < detail.transitions.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-border" />
              )}
            </div>
            <div className="pb-3 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={`text-xs ${STATUS_COLORS[t.from_status]}`}
                >
                  {STATUS_LABELS[t.from_status]}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <Badge
                  variant="outline"
                  className={`text-xs ${STATUS_COLORS[t.to_status]}`}
                >
                  {STATUS_LABELS[t.to_status]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(t.created_at)}
                {t.actor_role && (
                  <span className="ml-1.5 capitalize">· {t.actor_role}</span>
                )}
              </p>
              {t.note && (
                <p className="mt-1 rounded bg-muted/50 px-2 py-1 text-xs text-foreground">
                  {t.note}
                </p>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

// ============================================================================
// LAWYER COMMENTS PANEL
// ============================================================================

interface LawyerCommentsPanelProps {
  detail: AssessmentDetail;
  isHR: boolean;
  resolvingId: string | null;
  onResolve: (commentId: string) => void;
}

function LawyerCommentsPanel({
  detail,
  isHR,
  resolvingId,
  onResolve,
}: LawyerCommentsPanelProps) {
  const commentsBySection = detail.comments.reduce<
    Record<string, typeof detail.comments>
  >((acc, c) => {
    const key = c.section;
    return { ...acc, [key]: [...(acc[key] ?? []), c] };
  }, {});

  if (detail.comments.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        Noch keine Anwalt-Kommentare vorhanden.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(commentsBySection).map(([section, comments]) => (
        <div key={section}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {SECTION_LABELS[section] ?? section}
          </p>
          <div className="space-y-2">
            {comments.map((c) => (
              <div
                key={c.id}
                className={`rounded-lg border p-3 ${
                  c.resolved
                    ? 'border-border bg-muted/30 opacity-60'
                    : 'border-border bg-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${SEVERITY_COLORS[c.severity]}`}
                    >
                      {SEVERITY_LABELS[c.severity]}
                    </Badge>
                    {c.resolved && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                      >
                        Geloest
                      </Badge>
                    )}
                  </div>
                  {isHR && !c.resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={resolvingId === c.id}
                      onClick={() => onResolve(c.id)}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {resolvingId === c.id ? 'Wird markiert...' : 'Als geloest markieren'}
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-sm">{c.comment_text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(c.created_at)}
                  {c.resolved_at && ` · Geloest am ${formatDateTime(c.resolved_at)}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// CERTIFICATE PANEL
// ============================================================================

interface CertificatePanelProps {
  detail: AssessmentDetail;
}

function CertificatePanel({ detail }: CertificatePanelProps) {
  if (!detail.snapshot) return null;
  const { snapshot } = detail;

  return (
    <div className="rounded-xl border-2 border-green-300 bg-green-50 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-green-200 p-3">
          <Award className="h-7 w-7 text-green-700" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-base font-bold text-green-900">
              Zertifizierte Pruefung
            </p>
          </div>
          <p className="text-sm font-medium text-green-800">
            Von externem Rechtsberater geprueft
          </p>
          <Separator className="bg-green-200" />
          {snapshot.lawyer_statement && (
            <Alert className="border-green-200 bg-white/60">
              <FileText className="h-4 w-4 text-green-700" />
              <AlertDescription className="text-sm text-green-900 italic">
                "{snapshot.lawyer_statement}"
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-green-800">
            <span>
              <span className="font-medium">Zertifiziert am: </span>
              {formatDate(snapshot.certified_at)}
            </span>
            <span>
              <span className="font-medium">Gueltig bis: </span>
              {formatDate(snapshot.valid_until)}
            </span>
            <span>
              <span className="font-medium">Mitarbeiter: </span>
              {snapshot.snapshot_data.employees_count}
            </span>
          </div>
          {snapshot.pdf_url && (
            <a
              href={snapshot.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Zertifikat herunterladen
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACTION BUTTONS
// ============================================================================

interface ActionButtonsProps {
  detail: AssessmentDetail;
  role: string | null;
  isHR: boolean;
  onTransition: (
    to: ComplianceAssessmentStatus,
    note?: string,
    lawyerId?: string,
  ) => Promise<void>;
  transitioning: boolean;
}

function ActionButtons({
  detail,
  role,
  isHR,
  onTransition,
  transitioning,
}: ActionButtonsProps) {
  const [resubmitNote, setResubmitNote] = useState('');
  const [lawyerIdInput, setLawyerIdInput] = useState(detail.lawyer_id ?? '');
  const [showLawyerInput, setShowLawyerInput] = useState(false);

  if (!isHR) return null;

  const transitions = VALID_TRANSITIONS[detail.status] ?? [];
  const allowedTransitions = transitions.filter((t) =>
    t.allowedRoles.includes(
      (role as 'admin' | 'hr_manager' | 'lawyer' | 'system') ?? 'hr_manager',
    ),
  );

  if (allowedTransitions.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Verfuegbare Aktionen
      </p>

      {allowedTransitions.map((t) => {
        const isSubmitToLawyer = t.to === 'PENDING_REVIEW';
        const isResubmit = t.to === 'RESUBMITTED';
        const isAnalyze = t.to === 'ANALYZED';

        if (isSubmitToLawyer) {
          return (
            <div key={t.to} className="space-y-2">
              {showLawyerInput ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Anwalt Logto User-ID
                      <span className="ml-1 text-muted-foreground font-normal">
                        (Logto User-ID des Anwalts)
                      </span>
                    </Label>
                    <Input
                      value={lawyerIdInput}
                      onChange={(e) => setLawyerIdInput(e.target.value)}
                      placeholder="user_xxxxxxxxxxxxxxxxxxxx"
                      disabled={transitioning}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLawyerInput(false)}
                      disabled={transitioning}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      size="sm"
                      disabled={transitioning || !lawyerIdInput.trim()}
                      onClick={() =>
                        onTransition(t.to, undefined, lawyerIdInput.trim())
                      }
                    >
                      <Scale className="mr-2 h-4 w-4" />
                      {transitioning
                        ? 'Wird eingereicht...'
                        : 'Zur Anwaltspruefung einreichen'}
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setShowLawyerInput(true)}
                  disabled={transitioning}
                >
                  <Scale className="mr-2 h-4 w-4" />
                  {t.label}
                </Button>
              )}
            </div>
          );
        }

        if (isResubmit) {
          return (
            <div key={t.to} className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">
                  Notiz zur erneuten Einreichung
                </Label>
                <Textarea
                  value={resubmitNote}
                  onChange={(e) => setResubmitNote(e.target.value)}
                  placeholder="Beschreiben Sie die vorgenommenen Aenderungen..."
                  rows={3}
                  disabled={transitioning}
                />
              </div>
              <Button
                size="sm"
                disabled={transitioning}
                onClick={() => onTransition(t.to, resubmitNote.trim() || undefined)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {transitioning ? 'Wird eingereicht...' : t.label}
              </Button>
            </div>
          );
        }

        if (isAnalyze) {
          return (
            <Button
              key={t.to}
              size="sm"
              className="w-full sm:w-auto"
              disabled={transitioning}
              onClick={() => onTransition(t.to)}
            >
              <Shield className="mr-2 h-4 w-4" />
              {transitioning ? 'Analyse wird gestartet...' : t.label}
            </Button>
          );
        }

        return (
          <Button
            key={t.to}
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={transitioning}
            onClick={() => onTransition(t.to)}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            {transitioning ? 'Wird verarbeitet...' : t.label}
          </Button>
        );
      })}
    </div>
  );
}

// ============================================================================
// DETAIL PANEL
// ============================================================================

interface DetailPanelProps {
  assessmentId: string;
  role: string | null;
  isHR: boolean;
  onClose: () => void;
}

function DetailPanel({ assessmentId, role, isHR, onClose }: DetailPanelProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const {
    currentAssessment,
    loading,
    transitionStatus,
    resolveComment,
    refetch,
  } = useComplianceAssessments({ assessmentId });

  const handleResolve = async (commentId: string) => {
    if (!currentAssessment) return;
    setResolvingId(commentId);
    await resolveComment(currentAssessment.id, commentId);
    setResolvingId(null);
  };

  const handleTransition = async (
    to: ComplianceAssessmentStatus,
    note?: string,
  ) => {
    if (!currentAssessment) return;
    setTransitioning(true);
    const ok = await transitionStatus(currentAssessment.id, to, note);
    if (ok) refetch();
    setTransitioning(false);
  };

  if (loading && !currentAssessment) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!currentAssessment) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Pruefungsdetails konnten nicht geladen werden.
        </p>
        <Button variant="outline" size="sm" onClick={onClose}>
          Schliessen
        </Button>
      </div>
    );
  }

  const d = currentAssessment;
  const isCertified = d.status === 'CERTIFIED_SNAPSHOT';
  const hasChangesRequested = d.status === 'CHANGES_REQUESTED';

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">
              {d.title ?? 'Compliance-Pruefung'}
            </h3>
            <Badge
              variant="outline"
              className={`text-xs ${STATUS_COLORS[d.status]}`}
            >
              {STATUS_LABELS[d.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Zeitraum: {formatDate(d.period_from)} – {formatDate(d.period_to)}
          </p>
          {d.risk_score !== null && (
            <p className="text-sm text-muted-foreground">
              Risiko-Score: <span className="font-medium">{d.risk_score}/100</span>
            </p>
          )}
          {d.expires_at && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Laeuft ab: {formatDate(d.expires_at)}
            </p>
          )}
        </div>

        {/* Changes requested banner */}
        {hasChangesRequested && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-800">
              Der Anwalt hat Korrekturen angefordert. Bitte lesen Sie die
              Kommentare unten und reichen Sie die Pruefung anschliessend erneut
              ein.
            </AlertDescription>
          </Alert>
        )}

        {/* Certificate */}
        {isCertified && d.snapshot && <CertificatePanel detail={d} />}

        {/* Actions */}
        <ActionButtons
          detail={d}
          role={role}
          isHR={isHR}
          onTransition={handleTransition}
          transitioning={transitioning}
        />

        <Separator />

        {/* Status Timeline */}
        <div>
          <p className="mb-3 text-sm font-semibold">Status-Verlauf</p>
          <StatusTimeline detail={d} />
        </div>

        <Separator />

        {/* Lawyer Comments */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Anwalt-Kommentare</p>
            {d.comments.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {d.comments.filter((c) => !c.resolved).length} offen
              </Badge>
            )}
          </div>
          <LawyerCommentsPanel
            detail={d}
            isHR={isHR}
            resolvingId={resolvingId}
            onResolve={handleResolve}
          />
        </div>
      </div>
    </ScrollArea>
  );
}

// ============================================================================
// NEW ASSESSMENT SCHEMA + DIALOG
// ============================================================================

const newAssessmentSchema = z
  .object({
    title: z.string().min(1, 'Titel ist erforderlich'),
    period_from: z.string().min(1, 'Von-Datum ist erforderlich'),
    period_to: z.string().min(1, 'Bis-Datum ist erforderlich'),
    lawyer_id: z.string().optional(),
  })
  .refine((data) => data.period_from <= data.period_to, {
    message: 'Das Von-Datum muss vor dem Bis-Datum liegen',
    path: ['period_to'],
  });

type NewAssessmentFormValues = z.infer<typeof newAssessmentSchema>;

interface NewAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (values: NewAssessmentFormValues) => Promise<void>;
}

function NewAssessmentDialog({
  open,
  onClose,
  onCreate,
}: NewAssessmentDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewAssessmentFormValues>({
    resolver: zodResolver(newAssessmentSchema),
    defaultValues: {
      title: '',
      period_from: '',
      period_to: '',
      lawyer_id: '',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: NewAssessmentFormValues) => {
    setSubmitting(true);
    await onCreate(values);
    setSubmitting(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Compliance-Pruefung</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              placeholder="z.B. Jahrespruefung 2024"
              disabled={submitting}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="period_from">Zeitraum von</Label>
              <Input
                id="period_from"
                type="date"
                disabled={submitting}
                {...register('period_from')}
              />
              {errors.period_from && (
                <p className="text-xs text-destructive">
                  {errors.period_from.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="period_to">Zeitraum bis</Label>
              <Input
                id="period_to"
                type="date"
                disabled={submitting}
                {...register('period_to')}
              />
              {errors.period_to && (
                <p className="text-xs text-destructive">
                  {errors.period_to.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="lawyer_id">
              Anwalt{' '}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="lawyer_id"
              placeholder="Logto User-ID des Anwalts"
              disabled={submitting}
              {...register('lawyer_id')}
            />
            <p className="text-xs text-muted-foreground">
              Logto User-ID des zugeordneten externen Anwalts
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Wird erstellt...' : 'Pruefung erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// LOADING SKELETONS
// ============================================================================

function AssessmentListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN VIEW
// ============================================================================

export default function ComplianceWorkflowView() {
  const { role } = useAuth();
  const isHR = role === 'admin' || role === 'hr_manager';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { assessments, loading, createAssessment } = useComplianceAssessments();

  const handleCreate = async (values: NewAssessmentFormValues) => {
    const result = await createAssessment({
      title: values.title,
      period_from: values.period_from,
      period_to: values.period_to,
      lawyer_id: values.lawyer_id || undefined,
    });
    if (result) {
      setDialogOpen(false);
      setSelectedId(result.id);
    }
  };

  const selected = assessments.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Compliance-Pruefungen</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Dokumentierte Compliance-Bewertungen gemaess EU-Entgelttransparenzrichtlinie 2023/970
          </p>
        </div>
        {isHR && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Neue Pruefung
          </Button>
        )}
      </div>

      {/* Stats row */}
      {!loading && assessments.length > 0 && (
        <StatsRow assessments={assessments} />
      )}
      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main content area */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <AssessmentListSkeleton />
          </div>
          <div className="hidden lg:col-span-3 lg:block">
            <Card className="h-64">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : assessments.length === 0 ? (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="rounded-full bg-muted p-5">
              <Shield className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                Noch keine Compliance-Pruefungen
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Starten Sie Ihre erste Pruefung, um die Einhaltung der
                EU-Entgelttransparenzrichtlinie zu dokumentieren.
              </p>
            </div>
            {isHR && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Erste Pruefung starten
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* List + detail layout */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Assessment list — 40% on large screens */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">
                  Alle Pruefungen
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {assessments.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Pruefung auswaehlen um Details anzuzeigen
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-2 pr-1">
                    {assessments.map((a) => (
                      <AssessmentListCard
                        key={a.id}
                        assessment={a}
                        isSelected={selectedId === a.id}
                        onClick={() =>
                          setSelectedId(
                            selectedId === a.id ? null : a.id,
                          )
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Detail panel — 60% on large screens */}
          <div className="lg:col-span-3">
            {selected ? (
              <Card className="min-h-[500px] overflow-hidden">
                <DetailPanel
                  assessmentId={selected.id}
                  role={role}
                  isHR={isHR}
                  onClose={() => setSelectedId(null)}
                />
              </Card>
            ) : (
              <Card className="flex min-h-[500px] items-center justify-center">
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Pruefung auswaehlen, um Details anzuzeigen
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* New assessment dialog */}
      <NewAssessmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
