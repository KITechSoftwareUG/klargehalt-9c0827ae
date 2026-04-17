'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  UserCheck,
  Calendar,
  Send,
} from 'lucide-react';
import {
  useJointAssessments,
  type JointAssessment,
  type JustificationFactor,
  type AssessmentStatus,
  type FactorType,
} from '@/hooks/useJointAssessments';
import { usePayGapSnapshots } from '@/hooks/usePayEquity';
import type { PayGapSnapshot } from '@/lib/types/pay-equity';
import { LawyerReviewBadge } from '@/components/dashboard/LawyerReviewBadge';

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const STATUS_STEPS: { key: AssessmentStatus[]; label: string }[] = [
  { key: ['initiated'], label: 'Initiiert' },
  { key: ['justifying'], label: 'Begründung' },
  { key: ['reviewing'], label: 'Überprüfung' },
  { key: ['agreed', 'dispute'], label: 'Einigung' },
  { key: ['remediating', 'closed'], label: 'Maßnahmen' },
];

function getStepIndex(status: AssessmentStatus): number {
  return STATUS_STEPS.findIndex((s) => s.key.includes(status));
}

const STATUS_LABELS: Record<AssessmentStatus, string> = {
  initiated: 'Initiiert',
  justifying: 'Begründung läuft',
  reviewing: 'In Überprüfung',
  agreed: 'Einigung erzielt',
  remediating: 'Maßnahmen',
  closed: 'Abgeschlossen',
  dispute: 'Streitig',
};

const STATUS_COLORS: Record<AssessmentStatus, string> = {
  initiated: 'bg-blue-100 text-blue-800',
  justifying: 'bg-amber-100 text-amber-800',
  reviewing: 'bg-purple-100 text-purple-800',
  agreed: 'bg-emerald-100 text-emerald-800',
  remediating: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-600',
  dispute: 'bg-red-100 text-red-800',
};

const FACTOR_LABELS: Record<FactorType, string> = {
  experience: 'Berufserfahrung',
  education: 'Bildungsabschluss',
  performance: 'Leistungsunterschiede',
  market_rate: 'Marktgehalt (Knappheit)',
  seniority: 'Betriebszugehörigkeit',
  working_conditions: 'Arbeitsbedingungen',
  role_scarcity: 'Rollenknappheit',
  other: 'Sonstiges',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE');
}

// ============================================================================
// STEP INDICATOR
// ============================================================================

function StepIndicator({ status }: { status: AssessmentStatus }) {
  const active = getStepIndex(status);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STATUS_STEPS.map((step, idx) => (
        <div key={step.label} className="flex items-center gap-1">
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0 ${
              idx < active
                ? 'bg-emerald-500 text-white'
                : idx === active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {idx < active ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
          </div>
          <span
            className={`text-xs hidden sm:inline ${
              idx === active ? 'font-semibold text-foreground' : 'text-muted-foreground'
            }`}
          >
            {step.label}
          </span>
          {idx < STATUS_STEPS.length - 1 && (
            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ADD ASSESSMENT DIALOG
// ============================================================================

interface AddAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    scope: string;
    scope_label: string;
    gap_pct: number;
    snapshot_id?: string;
  }) => Promise<void>;
  prefill?: { scope: string; scope_label: string; gap_pct: number; snapshot_id?: string };
}

function AddAssessmentDialog({ open, onClose, onSubmit, prefill }: AddAssessmentDialogProps) {
  const [scopeType, setScopeType] = useState(prefill?.scope ?? 'company');
  const [scopeLabel, setScopeLabel] = useState(prefill?.scope_label ?? '');
  const [gapPct, setGapPct] = useState(prefill ? String(prefill.gap_pct) : '');
  const [submitting, setSubmitting] = useState(false);

  // sync prefill when dialog opens for a new snapshot
  useEffect(() => {
    if (open && prefill) {
      setScopeType(prefill.scope);
      setScopeLabel(prefill.scope_label);
      setGapPct(String(prefill.gap_pct));
    } else if (!open) {
      setScopeType('company');
      setScopeLabel('');
      setGapPct('');
    }
  }, [open, prefill]);

  const handleSubmit = async () => {
    const gap = parseFloat(gapPct);
    if (!scopeLabel.trim() || isNaN(gap)) return;
    setSubmitting(true);
    await onSubmit({
      scope: scopeType,
      scope_label: scopeLabel.trim(),
      gap_pct: gap,
      snapshot_id: prefill?.snapshot_id,
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bewertung starten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Bereich</Label>
            <Select value={scopeType} onValueChange={setScopeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Gesamtunternehmen</SelectItem>
                <SelectItem value="department">Abteilung</SelectItem>
                <SelectItem value="job_profile">Job-Profil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Bezeichnung des Bereichs</Label>
            <Input
              value={scopeLabel}
              onChange={(e) => setScopeLabel(e.target.value)}
              placeholder="z.B. Engineering, Vertrieb …"
            />
          </div>
          <div className="space-y-1">
            <Label>Gender Pay Gap (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={gapPct}
              onChange={(e) => setGapPct(e.target.value)}
              placeholder="7.3"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !scopeLabel.trim() || !gapPct}>
              {submitting ? 'Wird erstellt…' : 'Bewertung starten'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// JUSTIFICATION TAB
// ============================================================================

interface JustificationTabProps {
  assessment: JointAssessment;
  onAdvance: () => Promise<void>;
  fetchJustifications: (id: string) => Promise<JustificationFactor[]>;
  addJustification: (
    id: string,
    input: {
      factor_type: FactorType;
      description: string;
      estimated_gap_impact_pct?: number;
      evidence_notes?: string;
    },
  ) => Promise<boolean>;
  deleteJustification: (id: string) => Promise<boolean>;
}

function JustificationTab({
  assessment,
  onAdvance,
  fetchJustifications,
  addJustification,
  deleteJustification,
}: JustificationTabProps) {
  const [factors, setFactors] = useState<JustificationFactor[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(false);
  const [factorType, setFactorType] = useState<FactorType>('experience');
  const [description, setDescription] = useState('');
  const [impactPct, setImpactPct] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const reload = useCallback(async () => {
    setLoadingFactors(true);
    const data = await fetchJustifications(assessment.id);
    setFactors(data);
    setLoadingFactors(false);
  }, [assessment.id, fetchJustifications]);

  useEffect(() => { void reload(); }, [reload]);

  const totalExplained = factors.reduce(
    (sum, f) => sum + (f.estimated_gap_impact_pct ?? 0),
    0,
  );
  const gap = assessment.gap_pct ?? 0;

  const handleAdd = async () => {
    if (!description.trim()) return;
    setAdding(true);
    const ok = await addJustification(assessment.id, {
      factor_type: factorType,
      description: description.trim(),
      estimated_gap_impact_pct: impactPct ? parseFloat(impactPct) : undefined,
      evidence_notes: evidenceNotes.trim() || undefined,
    });
    if (ok) {
      setDescription('');
      setImpactPct('');
      setEvidenceNotes('');
      await reload();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    await deleteJustification(id);
    await reload();
  };

  const handleAdvance = async () => {
    setAdvancing(true);
    await onAdvance();
    setAdvancing(false);
  };

  const canAdvance =
    assessment.status === 'justifying' || assessment.status === 'initiated';

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Begründeter Anteil</span>
          <span className="font-medium">
            {totalExplained.toFixed(1)} % von {gap.toFixed(1)} %
          </span>
        </div>
        <Progress value={gap > 0 ? Math.min((totalExplained / gap) * 100, 100) : 0} className="h-2" />
        {gap > 0 && (
          <p className="text-xs text-muted-foreground">
            Unbegründet: {Math.max(gap - totalExplained, 0).toFixed(1)} %
          </p>
        )}
      </div>

      {/* Existing factors */}
      {loadingFactors ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : factors.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Noch keine Begründungsfaktoren erfasst.
        </p>
      ) : (
        <div className="space-y-2">
          {factors.map((f) => (
            <div
              key={f.id}
              className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {FACTOR_LABELS[f.factor_type]}
                  </Badge>
                  {f.estimated_gap_impact_pct != null && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      ~{f.estimated_gap_impact_pct.toFixed(1)} %
                    </span>
                  )}
                </div>
                <p className="text-foreground break-words">{f.description}</p>
                {f.evidence_notes && (
                  <p className="text-xs text-muted-foreground break-words">{f.evidence_notes}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => handleDelete(f.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add factor form */}
      <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
        <p className="text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Faktor hinzufügen
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Faktortyp</Label>
            <Select value={factorType} onValueChange={(v) => setFactorType(v as FactorType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(FACTOR_LABELS) as [FactorType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Beschreibung</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Erläutern Sie den Faktor und seinen Einfluss …"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Geschätzter Einfluss (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={impactPct}
              onChange={(e) => setImpactPct(e.target.value)}
              placeholder="2.5"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nachweise / Notizen</Label>
            <Input
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              placeholder="z.B. Gehaltsumfrage 2024"
            />
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={adding || !description.trim()}
        >
          {adding ? 'Wird gespeichert…' : 'Faktor speichern'}
        </Button>
      </div>

      {/* Advance */}
      {canAdvance && (
        <div className="pt-2 flex justify-end">
          <Button onClick={handleAdvance} disabled={advancing}>
            {advancing ? 'Wird gesendet…' : 'Begründung abschließen & zur Überprüfung'}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// WORKER REP TAB
// ============================================================================

interface WorkerRepTabProps {
  assessment: JointAssessment;
  setWorkerRep: (id: string, name: string, email: string) => Promise<boolean>;
  recordWorkerDecision: (
    id: string,
    decision: 'approved' | 'disputed',
    comment: string,
  ) => Promise<boolean>;
  onRefetch: () => void;
}

function WorkerRepTab({ assessment, setWorkerRep, recordWorkerDecision, onRefetch }: WorkerRepTabProps) {
  const [name, setName] = useState(assessment.worker_rep_name ?? '');
  const [email, setEmail] = useState(assessment.worker_rep_email ?? '');
  const [decision, setDecision] = useState<'approved' | 'disputed'>('approved');
  const [comment, setComment] = useState(assessment.worker_rep_comment ?? '');
  const [savingRep, setSavingRep] = useState(false);
  const [savingDecision, setSavingDecision] = useState(false);

  const handleSetRep = async () => {
    if (!name.trim() || !email.trim()) return;
    setSavingRep(true);
    await setWorkerRep(assessment.id, name.trim(), email.trim());
    onRefetch();
    setSavingRep(false);
  };

  const handleDecision = async () => {
    setSavingDecision(true);
    await recordWorkerDecision(assessment.id, decision, comment);
    onRefetch();
    setSavingDecision(false);
  };

  const hasDecision = !!assessment.worker_rep_decision;

  return (
    <div className="space-y-6">
      {/* Set worker rep */}
      <div className="space-y-3">
        <p className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4" /> Arbeitnehmervertreter (Betriebsrat)
        </p>
        {hasDecision ? (
          <div
            className={`rounded-lg border p-3 flex items-start gap-3 ${
              assessment.worker_rep_decision === 'approved'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            {assessment.worker_rep_decision === 'approved' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {assessment.worker_rep_decision === 'approved' ? 'Zugestimmt' : 'Streitig gemeldet'}
              </p>
              <p className="text-xs text-muted-foreground">
                {assessment.worker_rep_name} · {formatDate(assessment.worker_rep_reviewed_at)}
              </p>
              {assessment.worker_rep_comment && (
                <p className="text-sm mt-1">{assessment.worker_rep_comment}</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Mustermann" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">E-Mail</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="br@firma.de" />
              </div>
            </div>
            {assessment.status === 'initiated' || assessment.status === 'justifying' ? (
              <p className="text-xs text-muted-foreground">
                Arbeitnehmervertreter kann nach Abschluss der Begründungsphase hinterlegt werden.
              </p>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSetRep}
                disabled={savingRep || !name.trim() || !email.trim()}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {savingRep ? 'Wird gespeichert…' : 'Vertreter speichern'}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Decision form — only show if rep is set and no decision yet */}
      {assessment.worker_rep_name && !hasDecision && assessment.status === 'reviewing' && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">Entscheidung erfassen</p>
          <div className="space-y-1">
            <Label className="text-xs">Entscheidung</Label>
            <Select value={decision} onValueChange={(v) => setDecision(v as 'approved' | 'disputed')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Zugestimmt</SelectItem>
                <SelectItem value="disputed">Streitig</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kommentar</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Anmerkungen des Betriebsrats …"
              rows={3}
            />
          </div>
          <Button size="sm" onClick={handleDecision} disabled={savingDecision}>
            {savingDecision ? 'Wird erfasst…' : 'Entscheidung speichern'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// REMEDIATION TAB
// ============================================================================

interface RemediationTabProps {
  assessment: JointAssessment;
  setRemediationPlan: (id: string, plan: string, deadline: string) => Promise<boolean>;
  closeAssessment: (id: string) => Promise<boolean>;
  onRefetch: () => void;
}

function RemediationTab({
  assessment,
  setRemediationPlan,
  closeAssessment,
  onRefetch,
}: RemediationTabProps) {
  const [plan, setPlan] = useState(assessment.remediation_plan ?? '');
  const [deadline, setDeadline] = useState(assessment.remediation_deadline ?? '');
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);

  const isClosed = assessment.status === 'closed';
  const planSaved = !!assessment.remediation_plan;

  const handleSave = async () => {
    if (!plan.trim() || !deadline) return;
    setSaving(true);
    await setRemediationPlan(assessment.id, plan.trim(), deadline);
    onRefetch();
    setSaving(false);
  };

  const handleClose = async () => {
    setClosing(true);
    await closeAssessment(assessment.id);
    onRefetch();
    setClosing(false);
  };

  if (isClosed) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        <p className="font-medium">Bewertung abgeschlossen</p>
        {assessment.remediation_closed_at && (
          <p className="text-sm text-muted-foreground">
            Abgeschlossen am {formatDate(assessment.remediation_closed_at)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" /> Maßnahmenplan
        </p>
        <div className="space-y-1">
          <Label className="text-xs">Maßnahmen zur Schließung des unbegründeten Gaps</Label>
          <Textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="Beschreiben Sie die konkreten Maßnahmen und Zeitpläne …"
            rows={5}
            disabled={isClosed}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Frist
          </Label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={isClosed}
          />
        </div>
        {!isClosed && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={saving || !plan.trim() || !deadline}
          >
            {saving ? 'Wird gespeichert…' : 'Plan speichern'}
          </Button>
        )}
      </div>

      {/* Close button */}
      <div className="pt-4 border-t flex justify-end">
        <Button
          onClick={handleClose}
          disabled={closing || (!planSaved && !plan.trim())}
          variant={planSaved ? 'default' : 'outline'}
        >
          {closing ? 'Wird abgeschlossen…' : 'Bewertung abschließen'}
          <CheckCircle2 className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// ASSESSMENT DETAIL SHEET
// ============================================================================

interface AssessmentSheetProps {
  assessment: JointAssessment;
  open: boolean;
  onClose: () => void;
  hook: ReturnType<typeof useJointAssessments>;
}

function AssessmentSheet({ assessment, open, onClose, hook }: AssessmentSheetProps) {
  const {
    updateStatus,
    fetchJustifications,
    addJustification,
    deleteJustification,
    setWorkerRep,
    recordWorkerDecision,
    setRemediationPlan,
    closeAssessment,
    refetch,
  } = hook;

  const handleAdvanceToReviewing = useCallback(async () => {
    await updateStatus(assessment.id, 'reviewing');
    refetch();
  }, [assessment.id, updateStatus, refetch]);

  const handleAdvanceToJustifying = useCallback(async () => {
    await updateStatus(assessment.id, 'justifying');
    refetch();
  }, [assessment.id, updateStatus, refetch]);

  const justifiedPct =
    assessment.gap_justified_pct ??
    // fall back will be updated via justification tab
    0;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" side="right">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            <Scale className="w-5 h-5 text-primary shrink-0" />
            <span>{assessment.scope_label}</span>
            {assessment.gap_pct != null && (
              <Badge variant="outline">{assessment.gap_pct.toFixed(1)} % Gap</Badge>
            )}
          </SheetTitle>
          <div className="pt-2">
            <StepIndicator status={assessment.status} />
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="justification">Begründung</TabsTrigger>
            <TabsTrigger value="workerrep">Betriebsrat</TabsTrigger>
            <TabsTrigger value="remediation">Maßnahmen</TabsTrigger>
          </TabsList>

          {/* TAB 1: ÜBERSICHT */}
          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3 space-y-0.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={STATUS_COLORS[assessment.status]}>
                  {STATUS_LABELS[assessment.status]}
                </Badge>
              </div>
              <div className="rounded-lg border p-3 space-y-0.5">
                <p className="text-xs text-muted-foreground">Gender Pay Gap</p>
                <p className="font-semibold text-lg">
                  {assessment.gap_pct != null ? `${assessment.gap_pct.toFixed(1)} %` : '—'}
                </p>
              </div>
              {assessment.gap_justified_pct != null && (
                <>
                  <div className="rounded-lg border p-3 space-y-0.5">
                    <p className="text-xs text-muted-foreground">Begründet</p>
                    <p className="font-medium text-emerald-700">
                      {justifiedPct.toFixed(1)} %
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 space-y-0.5">
                    <p className="text-xs text-muted-foreground">Unbegründet</p>
                    <p className="font-medium text-red-700">
                      {(assessment.gap_unjustified_pct ?? 0).toFixed(1)} %
                    </p>
                  </div>
                </>
              )}
              <div className="rounded-lg border p-3 space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Erstellt
                </p>
                <p>{formatDate(assessment.created_at)}</p>
              </div>
              {assessment.remediation_deadline && (
                <div className="rounded-lg border p-3 space-y-0.5">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Frist
                  </p>
                  <p>{formatDate(assessment.remediation_deadline)}</p>
                </div>
              )}
            </div>

            {/* Advance action button based on current status */}
            {assessment.status === 'initiated' && (
              <Button className="w-full mt-2" onClick={handleAdvanceToJustifying}>
                Weiter zu Schritt 2: Begründungsfaktoren erfassen
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </TabsContent>

          {/* TAB 2: BEGRÜNDUNG */}
          <TabsContent value="justification" className="pt-4">
            <JustificationTab
              assessment={assessment}
              onAdvance={handleAdvanceToReviewing}
              fetchJustifications={fetchJustifications}
              addJustification={addJustification}
              deleteJustification={deleteJustification}
            />
          </TabsContent>

          {/* TAB 3: ARBEITNEHMERVERTRETUNG */}
          <TabsContent value="workerrep" className="pt-4">
            <WorkerRepTab
              assessment={assessment}
              setWorkerRep={setWorkerRep}
              recordWorkerDecision={recordWorkerDecision}
              onRefetch={refetch}
            />
          </TabsContent>

          {/* TAB 4: MASSNAHMENPLAN */}
          <TabsContent value="remediation" className="pt-4">
            <RemediationTab
              assessment={assessment}
              setRemediationPlan={setRemediationPlan}
              closeAssessment={closeAssessment}
              onRefetch={refetch}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// ASSESSMENT CARD
// ============================================================================

interface AssessmentCardProps {
  assessment: JointAssessment;
  onClick: () => void;
}

function AssessmentCard({ assessment, onClick }: AssessmentCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{
        borderLeftColor:
          assessment.status === 'closed'
            ? '#d1d5db'
            : assessment.status === 'dispute'
              ? '#ef4444'
              : '#3b82f6',
      }}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base truncate">
              {assessment.scope_label}
              {assessment.gap_pct != null && (
                <span className="ml-2 text-muted-foreground font-normal text-sm">
                  — {assessment.gap_pct.toFixed(1)} % Gap
                </span>
              )}
            </CardTitle>
            <CardDescription>
              <StepIndicator status={assessment.status} />
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LawyerReviewBadge scopeType="joint_assessment" scopeId={assessment.id} compact />
            <Badge className={`${STATUS_COLORS[assessment.status]}`}>
              {STATUS_LABELS[assessment.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <div className="flex flex-wrap gap-4 text-sm">
          {(assessment.gap_justified_pct != null || assessment.gap_unjustified_pct != null) && (
            <>
              <span className="text-emerald-700">
                Begründet: {(assessment.gap_justified_pct ?? 0).toFixed(1)} %
              </span>
              <span className="text-red-700">
                Unbegründet: {(assessment.gap_unjustified_pct ?? 0).toFixed(1)} %
              </span>
            </>
          )}
          {assessment.worker_rep_name && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <UserCheck className="w-3.5 h-3.5" />
              {assessment.worker_rep_name}
              {assessment.worker_rep_decision === 'approved' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {assessment.worker_rep_decision === 'disputed' && (
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              )}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SNAPSHOTS REQUIRING ASSESSMENT BANNER
// ============================================================================

interface SnapshotBannerProps {
  snapshots: PayGapSnapshot[];
  existingAssessmentSnapshotIds: Set<string>;
  onStart: (snap: PayGapSnapshot) => void;
}

function SnapshotsBanner({ snapshots, existingAssessmentSnapshotIds, onStart }: SnapshotBannerProps) {
  const pending = snapshots.filter(
    (s) =>
      s.requires_joint_assessment &&
      s.id &&
      !existingAssessmentSnapshotIds.has(s.id),
  );

  if (pending.length === 0) return null;

  return (
    <Alert className="border-amber-300 bg-amber-50">
      <AlertTriangle className="w-4 h-4 text-amber-600" />
      <AlertTitle className="text-amber-900">Bewertungen erforderlich</AlertTitle>
      <AlertDescription className="text-amber-800">
        <p className="mb-3">Für folgende Bereiche ist eine Gemeinsame Entgeltbewertung erforderlich:</p>
        <div className="space-y-2">
          {pending.map((snap) => (
            <div
              key={snap.id}
              className="flex items-center justify-between gap-3 rounded-md bg-white/70 px-3 py-2"
            >
              <div className="text-sm">
                <span className="font-medium">{snap.scope_label ?? snap.scope}</span>
                {snap.mean_gap_base_pct != null && (
                  <span className="ml-2 text-muted-foreground">
                    {snap.mean_gap_base_pct.toFixed(1)} % Gap
                  </span>
                )}
              </div>
              <Button size="sm" onClick={() => onStart(snap)}>
                Bewertung starten
              </Button>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ============================================================================
// MAIN VIEW
// ============================================================================

export default function JointAssessmentView() {
  const hook = useJointAssessments();
  const { assessments, loading, createAssessment } = hook;

  const snapshotsQuery = usePayGapSnapshots();
  const snapshots = snapshotsQuery.data ?? [];

  const [selectedAssessment, setSelectedAssessment] = useState<JointAssessment | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogPrefill, setAddDialogPrefill] = useState<
    | { scope: string; scope_label: string; gap_pct: number; snapshot_id?: string }
    | undefined
  >(undefined);

  const existingSnapshotIds = new Set(
    assessments.map((a) => a.snapshot_id).filter(Boolean) as string[],
  );

  const handleAddFromSnapshot = (snap: PayGapSnapshot) => {
    setAddDialogPrefill({
      scope: snap.scope,
      scope_label: snap.scope_label ?? snap.scope,
      gap_pct: snap.mean_gap_base_pct ?? 0,
      snapshot_id: snap.id,
    });
    setAddDialogOpen(true);
  };

  const handleCreateAssessment = async (data: {
    scope: string;
    scope_label: string;
    gap_pct: number;
    snapshot_id?: string;
  }) => {
    await createAssessment({
      scope: data.scope,
      scope_label: data.scope_label,
      gap_pct: data.gap_pct,
      snapshot_id: data.snapshot_id,
    });
  };

  const handleOpenAdd = () => {
    setAddDialogPrefill(undefined);
    setAddDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Scale className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Gemeinsame Entgeltbewertungen</h1>
            <Badge variant="outline" className="text-xs font-mono">Art. 10 EU-RL 2023/970</Badge>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Formales Verfahren zur gemeinsamen Analyse und Behebung von Entgeltunterschieden
            zwischen Arbeitgeber und Arbeitnehmervertretung.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Neue Bewertung
        </Button>
      </div>

      {/* Info banner */}
      <Alert className="border-blue-200 bg-blue-50">
        <Scale className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          Eine Gemeinsame Entgeltbewertung ist erforderlich, wenn der Gender Pay Gap in einem
          Bereich mehr als <strong>5 %</strong> beträgt und nicht durch objektive Faktoren
          gerechtfertigt werden kann.
        </AlertDescription>
      </Alert>

      {/* Snapshots requiring assessment */}
      <SnapshotsBanner
        snapshots={snapshots}
        existingAssessmentSnapshotIds={existingSnapshotIds}
        onStart={handleAddFromSnapshot}
      />

      {/* Assessment list */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Scale className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Keine aktiven Bewertungen. Bei einem Gap &gt; 5% wird automatisch eine Bewertung
              empfohlen.
            </p>
            <Button variant="outline" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Erste Bewertung starten
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onClick={() => setSelectedAssessment(assessment)}
            />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      {selectedAssessment && (
        <AssessmentSheet
          assessment={
            // Always use the freshest data from the assessments list
            assessments.find((a) => a.id === selectedAssessment.id) ?? selectedAssessment
          }
          open={!!selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          hook={hook}
        />
      )}

      {/* Add dialog */}
      <AddAssessmentDialog
        open={addDialogOpen}
        onClose={() => { setAddDialogOpen(false); setAddDialogPrefill(undefined); }}
        onSubmit={handleCreateAssessment}
        prefill={addDialogPrefill}
      />
    </div>
  );
}
