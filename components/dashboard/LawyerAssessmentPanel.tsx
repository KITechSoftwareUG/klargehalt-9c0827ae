'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Scale,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Award,
  Send,
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
  type ComplianceAssessmentStatus,
  type CommentSection,
  type CommentSeverity,
  type CreateCommentInput,
  type CertifyAssessmentInput,
  type LegalReviewComment,
} from '@/lib/types/compliance-workflow';

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

const SECTION_LABELS: Record<CommentSection, string> = {
  pay_bands:          'Entgeltbänder',
  gap_analysis:       'Lückanalyse',
  job_profiles:       'Jobprofile',
  salary_decisions:   'Gehaltsentscheidungen',
  general:            'Allgemein',
};

function getRiskColor(score: number): string {
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-emerald-600';
}

function getRiskBgColor(score: number): string {
  if (score >= 70) return 'bg-red-100';
  if (score >= 40) return 'bg-amber-100';
  return 'bg-emerald-100';
}

function getRiskLabel(score: number): string {
  if (score >= 70) return 'Hohes Risiko';
  if (score >= 40) return 'Mittleres Risiko';
  return 'Geringes Risiko';
}

// ============================================================================
// CERTIFICATION DIALOG
// ============================================================================

interface CertificationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CertifyAssessmentInput) => Promise<boolean>;
}

function CertificationDialog({ open, onClose, onSubmit }: CertificationDialogProps) {
  const [statement, setStatement] = useState('');
  const [validMonths, setValidMonths] = useState(12);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isValid = statement.trim().length >= 20;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    const ok = await onSubmit({ lawyer_statement: statement.trim(), valid_months: validMonths });
    setSubmitting(false);
    if (ok) {
      setSuccess(true);
    }
  };

  const handleClose = () => {
    setStatement('');
    setValidMonths(12);
    setSubmitting(false);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-600" />
            Compliance-Prüfung zertifizieren
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <p className="font-semibold text-lg">Erfolgreich zertifiziert</p>
            <p className="text-sm text-muted-foreground">
              Der zertifizierte Compliance-Snapshot wurde erstellt und ist unveränderlich gespeichert.
            </p>
            <Button onClick={handleClose}>Schliessen</Button>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="lawyer-statement">
                Rechtliche Stellungnahme <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="lawyer-statement"
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Als unabhängiger Rechtsberater bestätige ich, dass die vorgelegten Unterlagen zur Entgelttransparenz geprüft wurden und..."
                rows={5}
                className={statement.length > 0 && !isValid ? 'border-red-400' : ''}
              />
              <p className="text-xs text-muted-foreground">
                {statement.length} Zeichen — mindestens 20 erforderlich
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valid-months">Gültigkeitsdauer (Monate)</Label>
              <Input
                id="valid-months"
                type="number"
                min={1}
                max={36}
                value={validMonths}
                onChange={(e) => setValidMonths(Math.max(1, Math.min(36, Number(e.target.value))))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">1 bis 36 Monate möglich.</p>
            </div>

            <Alert className="border-amber-200 bg-amber-50/60">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 text-sm">
                Mit dem Absenden bestätigen Sie als unabhängiger Rechtsberater, dass Sie die
                Unterlagen geprüft haben. Die Zertifizierung ist unveränderlich.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handleClose} disabled={submitting}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="gap-2"
              >
                <Award className="h-4 w-4" />
                {submitting ? 'Wird zertifiziert...' : 'Jetzt zertifizieren'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// COMMENT FORM
// ============================================================================

interface CommentFormProps {
  assessmentId: string;
  onAdd: (id: string, input: CreateCommentInput) => Promise<LegalReviewComment | null>;
}

function CommentForm({ assessmentId, onAdd }: CommentFormProps) {
  const [section, setSection] = useState<CommentSection>('general');
  const [severity, setSeverity] = useState<CommentSeverity>('INFO');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    const result = await onAdd(assessmentId, {
      section,
      severity,
      comment_text: text.trim(),
    });
    setSubmitting(false);
    if (result) {
      setText('');
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-4 bg-muted/30">
      <p className="text-sm font-medium text-muted-foreground">Kommentar hinzufügen</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Bereich</Label>
          <Select value={section} onValueChange={(v) => setSection(v as CommentSection)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(SECTION_LABELS) as [CommentSection, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Schweregrad</Label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as CommentSeverity)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(SEVERITY_LABELS) as [CommentSeverity, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Kommentar</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Rechtlicher Kommentar zu dieser Prüfung..."
          rows={3}
          className="text-sm"
        />
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          {submitting ? 'Wird gespeichert...' : 'Absenden'}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// COMMENT LIST ITEM
// ============================================================================

function CommentItem({ comment }: { comment: LegalReviewComment }) {
  return (
    <div className={`rounded-md border p-3 text-sm space-y-1 ${comment.resolved ? 'opacity-60 bg-muted/20' : 'bg-background'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[comment.severity]}`}>
          {SEVERITY_LABELS[comment.severity]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {SECTION_LABELS[comment.section]}
        </span>
        {comment.resolved && (
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            Erledigt
          </Badge>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {formatDate(comment.created_at)}
        </span>
      </div>
      <p className="text-muted-foreground leading-relaxed">{comment.comment_text}</p>
    </div>
  );
}

// ============================================================================
// TRANSITION BUTTONS
// ============================================================================

interface TransitionNoteDialogProps {
  open: boolean;
  label: string;
  required: boolean;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}

function TransitionNoteDialog({ open, label, required, onClose, onConfirm }: TransitionNoteDialogProps) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = required ? note.trim().length > 0 : true;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onConfirm(note.trim());
    setSubmitting(false);
    setNote('');
    onClose();
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="transition-note">
              Notiz {required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="transition-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={required ? 'Begründung ist erforderlich...' : 'Optionale Notiz...'}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={submitting}>
              Abbrechen
            </Button>
            <Button onClick={handleConfirm} disabled={!canSubmit || submitting}>
              {submitting ? 'Wird verarbeitet...' : 'Bestätigen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ASSESSMENT DETAIL PANEL
// ============================================================================

interface AssessmentDetailProps {
  assessment: ComplianceAssessment;
  onTransition: (id: string, to: ComplianceAssessmentStatus, note?: string) => Promise<boolean>;
  onAddComment: (id: string, input: CreateCommentInput) => Promise<LegalReviewComment | null>;
  onCertify: (id: string, input: CertifyAssessmentInput) => Promise<boolean>;
}

function AssessmentDetail({ assessment, onTransition, onAddComment, onCertify }: AssessmentDetailProps) {
  const [certifyDialogOpen, setCertifyDialogOpen] = useState(false);
  const [noteDialogConfig, setNoteDialogConfig] = useState<{
    open: boolean;
    to: ComplianceAssessmentStatus;
    label: string;
    required: boolean;
  } | null>(null);

  const lawyerTransitions = VALID_TRANSITIONS[assessment.status].filter(
    (t) => t.allowedRoles.includes('lawyer'),
  );

  const handleTransitionClick = (to: ComplianceAssessmentStatus, label: string, noteRequired: boolean) => {
    setNoteDialogConfig({ open: true, to, label, required: noteRequired });
  };

  const handleTransitionConfirm = async (note: string) => {
    if (!noteDialogConfig) return;
    await onTransition(assessment.id, noteDialogConfig.to, note || undefined);
    setNoteDialogConfig(null);
  };

  const handleCertifySubmit = async (input: CertifyAssessmentInput): Promise<boolean> => {
    const result = await onCertify(assessment.id, input);
    return result;
  };

  const { gap_flags, risk_score } = assessment;

  return (
    <div className="space-y-5 pt-2">
      {/* Data summary */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Datenzusammenfassung</p>

        {/* Risk score */}
        {risk_score !== null ? (
          <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${getRiskBgColor(risk_score)}`}>
            <div className="shrink-0">
              {risk_score >= 70 ? (
                <XCircle className={`h-6 w-6 ${getRiskColor(risk_score)}`} />
              ) : risk_score >= 40 ? (
                <AlertTriangle className={`h-6 w-6 ${getRiskColor(risk_score)}`} />
              ) : (
                <CheckCircle2 className={`h-6 w-6 ${getRiskColor(risk_score)}`} />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-bold text-lg ${getRiskColor(risk_score)}`}>{risk_score}/100</p>
              <p className={`text-xs font-medium ${getRiskColor(risk_score)}`}>
                {getRiskLabel(risk_score)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Risiko-Score</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Kein Risiko-Score verfügbar
          </div>
        )}

        {/* Gap flags */}
        {gap_flags && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className={`rounded-md border p-3 text-sm ${gap_flags.gender_gap_exceeded ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className="text-xs text-muted-foreground mb-1">Geschlechtslücke</p>
              <div className="flex items-center gap-1.5">
                {gap_flags.gender_gap_exceeded ? (
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                )}
                <span className={`font-medium text-xs ${gap_flags.gender_gap_exceeded ? 'text-red-700' : 'text-emerald-700'}`}>
                  {gap_flags.gender_gap_exceeded ? 'Überschritten (>5%)' : 'Im Rahmen'}
                </span>
              </div>
            </div>

            <div className={`rounded-md border p-3 text-sm ${gap_flags.missing_justifications > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className="text-xs text-muted-foreground mb-1">Fehlende Begründungen</p>
              <p className={`font-bold text-lg ${gap_flags.missing_justifications > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {gap_flags.missing_justifications}
              </p>
            </div>

            <div className={`rounded-md border p-3 text-sm ${gap_flags.bands_out_of_range > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <p className="text-xs text-muted-foreground mb-1">Ausserhalb Entgeltband</p>
              <p className={`font-bold text-lg ${gap_flags.bands_out_of_range > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {gap_flags.bands_out_of_range}
              </p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Comments section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Rechtliche Kommentare</p>
        </div>

        {/* Comment form — always visible for lawyer */}
        <CommentForm assessmentId={assessment.id} onAdd={onAddComment} />

        {/* Placeholder for existing comments — rendered by parent with full detail */}
        <p className="text-xs text-muted-foreground">
          Kommentare werden aus der Detailansicht geladen wenn vorhanden.
        </p>
      </div>

      <Separator />

      {/* Action buttons */}
      {lawyerTransitions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Aktionen</p>
          <div className="flex flex-wrap gap-2">
            {assessment.status === 'PENDING_REVIEW' && (
              <Button
                size="sm"
                variant="default"
                className="gap-1.5"
                onClick={() => handleTransitionClick('UNDER_REVIEW', 'Prüfung annehmen', false)}
              >
                <FileCheck className="h-4 w-4" />
                Prüfung annehmen
              </Button>
            )}

            {(assessment.status === 'UNDER_REVIEW' || assessment.status === 'RESUBMITTED') && (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => handleTransitionClick('CHANGES_REQUESTED', 'Korrekturen anfordern', true)}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Korrekturen anfordern
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleTransitionClick('VALIDATED', 'Prüfung freigeben', false)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Freigeben
                </Button>
              </>
            )}

            {assessment.status === 'VALIDATED' && (
              <Button
                size="sm"
                variant="default"
                className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                onClick={() => setCertifyDialogOpen(true)}
              >
                <Award className="h-4 w-4" />
                Zertifizieren
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Note dialog */}
      {noteDialogConfig && (
        <TransitionNoteDialog
          open={noteDialogConfig.open}
          label={noteDialogConfig.label}
          required={noteDialogConfig.required}
          onClose={() => setNoteDialogConfig(null)}
          onConfirm={handleTransitionConfirm}
        />
      )}

      {/* Certification dialog */}
      <CertificationDialog
        open={certifyDialogOpen}
        onClose={() => setCertifyDialogOpen(false)}
        onSubmit={handleCertifySubmit}
      />
    </div>
  );
}

// ============================================================================
// ASSESSMENT CARD
// ============================================================================

interface AssessmentCardProps {
  assessment: ComplianceAssessment;
  onTransition: (id: string, to: ComplianceAssessmentStatus, note?: string) => Promise<boolean>;
  onAddComment: (id: string, input: CreateCommentInput) => Promise<LegalReviewComment | null>;
  onCertify: (id: string, input: CertifyAssessmentInput) => Promise<boolean>;
}

function AssessmentCard({ assessment, onTransition, onAddComment, onCertify }: AssessmentCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/60 hover:border-border transition-colors">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <CardTitle className="text-base font-semibold leading-snug">
                  {assessment.title ?? 'Compliance-Prüfung'}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Zeitraum: {formatDate(assessment.period_from)} – {formatDate(assessment.period_to)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={`text-xs whitespace-nowrap ${STATUS_COLORS[assessment.status]}`}
                >
                  {STATUS_LABELS[assessment.status]}
                </Badge>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-5">
            <Separator className="mb-4" />
            <AssessmentDetail
              assessment={assessment}
              onTransition={onTransition}
              onAddComment={onAddComment}
              onCertify={onCertify}
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LawyerAssessmentPanel() {
  const { user } = useAuth();
  const {
    assessments,
    loading,
    transitionStatus,
    addComment,
    certifyAssessment,
  } = useComplianceAssessments();

  // Filter to only assessments assigned to the current lawyer
  const myAssessments = assessments.filter(
    (a) => a.lawyer_id === user?.id,
  );

  const handleCertify = async (id: string, input: CertifyAssessmentInput): Promise<boolean> => {
    const result = await certifyAssessment(id, input);
    return result !== null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Offene Compliance-Prüfungen</h2>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Offene Compliance-Prüfungen</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ihnen zugewiesene Prüfungen nach EU-Entgelttransparenzrichtlinie 2023/970.
        </p>
      </div>

      {/* Info banner */}
      <Alert className="border-blue-200 bg-blue-50/50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          Nur Assessments die Ihnen persönlich zugewiesen wurden sind hier sichtbar.
          Kommentare und Statuswechsel werden unveränderlich protokolliert.
        </AlertDescription>
      </Alert>

      {/* Empty state */}
      {myAssessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <FileCheck className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">
              Keine offenen Prüfungen zugewiesen.
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Sobald Ihnen eine Compliance-Prüfung zugewiesen wird, erscheint sie hier.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onTransition={transitionStatus}
              onAddComment={addComment}
              onCertify={handleCertify}
            />
          ))}
        </div>
      )}
    </div>
  );
}
