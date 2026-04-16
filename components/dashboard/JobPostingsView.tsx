'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Briefcase,
  Plus,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Building2,
  Euro,
  Edit,
  Trash2,
  Send,
  ChevronDown,
} from 'lucide-react';
import { useJobPostings, type CreateJobPostingInput, type JobPosting } from '@/hooks/useJobPostings';
import { useJobProfiles } from '@/hooks/useJobProfiles';
import { useJobLevels } from '@/hooks/useJobLevels';
import { useDepartments } from '@/hooks/useDepartments';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function formatSalary(value: number): string {
  return currencyFormatter.format(value);
}

function generateExportText(posting: JobPosting): string {
  const employmentLabel: Record<string, string> = {
    full_time: 'Vollzeit',
    part_time: 'Teilzeit',
    contract: 'Befristet',
    internship: 'Praktikum',
  };
  const empType = posting.employment_type ? employmentLabel[posting.employment_type] : '';
  const location = posting.location ?? '';

  const parts = [posting.title];
  if (empType) parts.push(empType);
  if (location) parts.push(location);

  return (
    `${parts.join(' | ')} | Vergütung: ${posting.salary_range_min} – ${posting.salary_range_max} EUR/Jahr\n` +
    `Gemäß EU-Richtlinie 2023/970 (Entgelttransparenz) veröffentlichen wir den Gehaltsbereich für diese Position.`
  );
}

const STATUS_LABELS: Record<JobPosting['status'], string> = {
  draft: 'Entwurf',
  published: 'Veröffentlicht',
  closed: 'Geschlossen',
};

const STATUS_STYLES: Record<JobPosting['status'], string> = {
  draft: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  published: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  closed: 'bg-muted text-muted-foreground',
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Vollzeit',
  part_time: 'Teilzeit',
  contract: 'Befristet',
  internship: 'Praktikum',
};

// ---------------------------------------------------------------------------
// Default form state
// ---------------------------------------------------------------------------

const EMPTY_FORM: CreateJobPostingInput = {
  title: '',
  job_profile_id: undefined,
  job_level_id: undefined,
  department_id: undefined,
  salary_range_min: 0,
  salary_range_max: 0,
  currency: 'EUR',
  location: '',
  employment_type: undefined,
  description: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function JobPostingsView() {
  const { postings, loading, createPosting, updatePosting, publishPosting, closePosting, deletePosting, getSuggestedRange } =
    useJobPostings();
  const { jobProfiles } = useJobProfiles();
  const { jobLevels } = useJobLevels();
  const { departments } = useDepartments();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosting, setEditingPosting] = useState<JobPosting | null>(null);
  const [form, setForm] = useState<CreateJobPostingInput>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // -----------------------------------------------------------------------
  // Dialog helpers
  // -----------------------------------------------------------------------

  function openCreateDialog() {
    setEditingPosting(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(posting: JobPosting) {
    setEditingPosting(posting);
    setForm({
      title: posting.title,
      job_profile_id: posting.job_profile_id ?? undefined,
      job_level_id: posting.job_level_id ?? undefined,
      department_id: posting.department_id ?? undefined,
      salary_range_min: posting.salary_range_min,
      salary_range_max: posting.salary_range_max,
      currency: posting.currency,
      location: posting.location ?? '',
      employment_type: posting.employment_type ?? undefined,
      description: posting.description ?? '',
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingPosting(null);
    setForm(EMPTY_FORM);
  }

  // -----------------------------------------------------------------------
  // Form actions
  // -----------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error('Bitte einen Titel eingeben');
      return;
    }
    if (!form.salary_range_min || !form.salary_range_max) {
      toast.error('Bitte einen gültigen Gehaltsbereich eingeben');
      return;
    }
    if (form.salary_range_min > form.salary_range_max) {
      toast.error('Mindestgehalt darf nicht höher sein als Höchstgehalt');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPosting) {
        await updatePosting(editingPosting.id, form);
      } else {
        await createPosting(form);
      }
      closeDialog();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSuggestRange() {
    if (!form.job_profile_id) {
      toast.error('Bitte zuerst ein Job-Profil auswählen');
      return;
    }
    setLoadingSuggest(true);
    const result = await getSuggestedRange(form.job_profile_id, form.job_level_id);
    setLoadingSuggest(false);
    if (result) {
      setForm((prev) => ({
        ...prev,
        salary_range_min: result.min,
        salary_range_max: result.max,
        currency: result.currency,
      }));
      toast.success('Gehaltsband übernommen');
    } else {
      toast.error('Kein passendes Gehaltsband gefunden');
    }
  }

  async function handleExport(posting: JobPosting) {
    const text = posting.export_text ?? generateExportText(posting);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Exporttext in die Zwischenablage kopiert');
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  }

  async function handleDelete(posting: JobPosting) {
    if (!window.confirm(`Stelle "${posting.title}" wirklich löschen?`)) return;
    await deletePosting(posting.id);
  }

  // -----------------------------------------------------------------------
  // Derived state
  // -----------------------------------------------------------------------

  const publishedPostings = postings.filter((p) => p.status === 'published');
  const hasAnyPostings = postings.length > 0;

  // Filter job levels by selected job profile (via pay_bands relationship – here we just show all)
  const filteredJobLevels = jobLevels;

  // -----------------------------------------------------------------------
  // Render: loading skeleton
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render: main view
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stellenausschreibungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gemäß Art. 5 der EU-Entgelttransparenzrichtlinie 2023/970 müssen alle
            Stellenanzeigen einen Gehaltsbereich enthalten.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Neue Stelle
        </Button>
      </div>

      {/* Article 5 compliance banner */}
      {hasAnyPostings ? (
        publishedPostings.length > 0 ? (
          <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-emerald-700 dark:text-emerald-400">
              Alle veröffentlichten Stellenanzeigen enthalten Gehaltsangaben und sind konform mit
              Art. 5 der EU-Entgelttransparenzrichtlinie 2023/970.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              Sie haben noch keine Stellen veröffentlicht. Veröffentlichen Sie Stellen, um die
              Anforderungen von Art. 5 zu erfüllen.
            </AlertDescription>
          </Alert>
        )
      ) : (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Erstellen Sie Ihre erste Stelle und stellen Sie die Konformität mit der
            EU-Entgelttransparenzrichtlinie sicher.
          </AlertDescription>
        </Alert>
      )}

      {/* Postings list */}
      {postings.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="mb-1 text-lg font-semibold">Keine Stellenausschreibungen</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Erstellen Sie Ihre erste Stelle mit transparentem Gehaltsbereich gemäß
            EU-Richtlinie 2023/970.
          </p>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Erste Stelle erstellen
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {postings.map((posting) => (
            <PostingCard
              key={posting.id}
              posting={posting}
              onEdit={() => openEditDialog(posting)}
              onPublish={() => publishPosting(posting.id)}
              onClose={() => closePosting(posting.id)}
              onDelete={() => handleDelete(posting)}
              onExport={() => handleExport(posting)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPosting ? 'Stelle bearbeiten' : 'Neue Stelle erstellen'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Titel */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Titel <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="z. B. Senior Software Engineer"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Job-Profil */}
              <div className="space-y-1.5">
                <Label>Job-Profil</Label>
                <Select
                  value={form.job_profile_id ?? ''}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      job_profile_id: v || undefined,
                      job_level_id: undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kein Profil" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Karrierestufe */}
              <div className="space-y-1.5">
                <Label>Karrierestufe</Label>
                <Select
                  value={form.job_level_id ?? ''}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, job_level_id: v || undefined }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keine Stufe" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredJobLevels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Abteilung */}
              <div className="space-y-1.5">
                <Label>Abteilung</Label>
                <Select
                  value={form.department_id ?? ''}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, department_id: v || undefined }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keine Abteilung" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Beschäftigungsart */}
              <div className="space-y-1.5">
                <Label>Beschäftigungsart</Label>
                <Select
                  value={form.employment_type ?? ''}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      employment_type: (v as JobPosting['employment_type']) || undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keine Angabe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Vollzeit</SelectItem>
                    <SelectItem value="part_time">Teilzeit</SelectItem>
                    <SelectItem value="contract">Befristet</SelectItem>
                    <SelectItem value="internship">Praktikum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ort */}
            <div className="space-y-1.5">
              <Label htmlFor="location">Ort</Label>
              <Input
                id="location"
                placeholder="z. B. Berlin, Remote"
                value={form.location ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>

            {/* Gehaltsbereich */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Gehaltsbereich (€/Jahr) <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleSuggestRange}
                  disabled={!form.job_profile_id || loadingSuggest}
                >
                  <ChevronDown className="h-3 w-3" />
                  {loadingSuggest ? 'Wird geladen…' : 'Aus Gehaltsband übernehmen'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="salary-min" className="text-xs text-muted-foreground">
                    Minimum
                  </Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="salary-min"
                      type="number"
                      min={0}
                      className="pl-8"
                      placeholder="40000"
                      value={form.salary_range_min || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          salary_range_min: Number(e.target.value),
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salary-max" className="text-xs text-muted-foreground">
                    Maximum
                  </Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="salary-max"
                      type="number"
                      min={0}
                      className="pl-8"
                      placeholder="60000"
                      value={form.salary_range_max || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          salary_range_max: Number(e.target.value),
                        }))
                      }
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Kurzbeschreibung */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Kurzbeschreibung</Label>
              <Textarea
                id="description"
                placeholder="Aufgaben, Anforderungen und Besonderheiten der Stelle…"
                rows={4}
                value={form.description ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? 'Wird gespeichert…'
                  : editingPosting
                  ? 'Änderungen speichern'
                  : 'Stelle erstellen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PostingCard sub-component
// ---------------------------------------------------------------------------

interface PostingCardProps {
  posting: JobPosting;
  onEdit: () => void;
  onPublish: () => void;
  onClose: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function PostingCard({ posting, onEdit, onPublish, onClose, onDelete, onExport }: PostingCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={STATUS_STYLES[posting.status]}>
                {posting.status === 'draft' && <Clock className="mr-1 h-3 w-3" />}
                {posting.status === 'published' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {posting.status === 'closed' && <AlertTriangle className="mr-1 h-3 w-3" />}
                {STATUS_LABELS[posting.status]}
              </Badge>

              {posting.employment_type && (
                <Badge variant="outline" className="text-xs">
                  {EMPLOYMENT_TYPE_LABELS[posting.employment_type]}
                </Badge>
              )}

              {posting.job_profile_title && (
                <Badge variant="secondary" className="text-xs">
                  <Briefcase className="mr-1 h-3 w-3" />
                  {posting.job_profile_title}
                </Badge>
              )}

              {posting.job_level_name && (
                <Badge variant="secondary" className="text-xs">
                  {posting.job_level_name}
                </Badge>
              )}
            </div>

            <h3 className="mt-2 truncate text-base font-semibold">{posting.title}</h3>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {posting.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {posting.location}
                </span>
              )}
              {posting.department_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {posting.department_name}
                </span>
              )}
              {posting.published_at && (
                <span className="flex items-center gap-1">
                  <Send className="h-3.5 w-3.5" />
                  {new Date(posting.published_at).toLocaleDateString('de-DE')}
                </span>
              )}
            </div>
          </div>

          {/* Salary range */}
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">Gehaltsbereich</p>
            <p className="mt-0.5 font-semibold text-emerald-700 dark:text-emerald-400">
              {formatSalary(posting.salary_range_min)} – {formatSalary(posting.salary_range_max)}
            </p>
            <p className="text-xs text-muted-foreground">pro Jahr</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
            Bearbeiten
          </Button>

          {posting.status === 'draft' && (
            <Button size="sm" className="gap-1.5" onClick={onPublish}>
              <Send className="h-3.5 w-3.5" />
              Veröffentlichen
            </Button>
          )}

          {posting.status === 'published' && (
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={onClose}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Schließen
            </Button>
          )}

          <Button variant="outline" size="sm" className="gap-1.5" onClick={onExport}>
            <Copy className="h-3.5 w-3.5" />
            Exportieren
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Löschen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
