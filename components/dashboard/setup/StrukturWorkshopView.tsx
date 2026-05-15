'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Layers,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRoleAccess } from '@/components/RoleGuard';
import AccessDenied from '@/components/dashboard/AccessDenied';
import { useDepartments, type Department } from '@/hooks/useDepartments';
import { useJobLevels, type JobLevel } from '@/hooks/useJobLevels';
import { SETUP_TEMPLATES } from '@/lib/setup-templates';

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const departmentSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Maximal 100 Zeichen'),
});

const jobLevelSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Maximal 100 Zeichen'),
  rank: z.number({ invalid_type_error: 'Rang muss eine Zahl sein' }).int().min(1, 'Rang muss ≥ 1 sein'),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;
type JobLevelFormValues = z.infer<typeof jobLevelSchema>;

// ─── Template preview card ────────────────────────────────────────────────────

interface TemplateBulkApplyProps {
  onApply: () => void;
  isApplying: boolean;
}

function TemplateBulkApplyCard({ onApply, isApplying }: TemplateBulkApplyProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const template = SETUP_TEMPLATES['tech-startup'];

  return (
    <>
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-slate-900">{template.label}</h3>
                <Badge variant="secondary" className="text-xs">Empfohlen</Badge>
              </div>
              <p className="text-sm text-slate-600 mb-4">{template.description}</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Abteilungen ({template.departments.length})
                  </p>
                  <ul className="space-y-1">
                    {template.departments.map((d) => (
                      <li key={d.name} className="flex items-center gap-2 text-sm text-slate-700">
                        <Building className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        {d.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Karrierestufen ({template.jobLevels.length})
                  </p>
                  <ul className="space-y-1">
                    {template.jobLevels.map((l) => (
                      <li key={l.name} className="flex items-center gap-2 text-sm text-slate-700">
                        <Layers className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        {l.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={isApplying}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isApplying ? 'Vorlage wird angelegt…' : 'Vorlage anwenden'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vorlage &quot;{template.label}&quot; anwenden?</AlertDialogTitle>
            <AlertDialogDescription>
              Es werden {template.departments.length} Abteilungen und {template.jobLevels.length} Karrierestufen
              angelegt. Du kannst danach jederzeit einzelne Einträge bearbeiten oder weitere hinzufügen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirm(false);
                onApply();
              }}
            >
              Vorlage anwenden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Departments column ───────────────────────────────────────────────────────

interface DepartmentsColumnProps {
  departments: Department[];
  loading: boolean;
  onAdd: (values: DepartmentFormValues) => Promise<void>;
  onEdit: (dept: Department) => void;
  onDelete: (dept: Department) => void;
}

function DepartmentsColumn({ departments, loading, onAdd, onEdit, onDelete }: DepartmentsColumnProps) {
  const [showForm, setShowForm] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '' },
  });

  const handleAdd = handleSubmit(async (values) => {
    await onAdd(values);
    reset();
    setShowForm(false);
  });

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {departments.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
          <Building className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500 text-center mb-3">Noch keine Abteilungen angelegt</p>
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Erste Abteilung hinzufügen
          </Button>
        </div>
      )}

      {departments.length > 0 && (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {departments.map((dept) => (
            <li key={dept.id} className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors">
              <Building className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-slate-800 truncate">{dept.name}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onEdit(dept)}
                  aria-label={`${dept.name} bearbeiten`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDelete(dept)}
                  aria-label={`${dept.name} löschen`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
          <div className="space-y-1">
            <Label htmlFor="dept-name" className="text-xs">
              Name *
            </Label>
            <Input
              id="dept-name"
              {...register('name')}
              placeholder="z.B. Engineering, Sales, HR"
              autoFocus
              className="h-8 text-sm"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting} className="h-8">
              {isSubmitting ? 'Speichern…' : 'Hinzufügen'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => {
                reset();
                setShowForm(false);
              }}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      ) : (
        departments.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" />
            Weitere Abteilung
          </Button>
        )
      )}
    </div>
  );
}

// ─── Job levels column ────────────────────────────────────────────────────────

interface JobLevelsColumnProps {
  jobLevels: JobLevel[];
  loading: boolean;
  onAdd: (values: JobLevelFormValues) => Promise<void>;
  onEdit: (level: JobLevel) => void;
  onDelete: (level: JobLevel) => void;
}

function JobLevelsColumn({ jobLevels, loading, onAdd, onEdit, onDelete }: JobLevelsColumnProps) {
  const [showForm, setShowForm] = useState(false);
  const nextRank = jobLevels.length > 0 ? Math.max(...jobLevels.map((l) => l.rank)) + 1 : 1;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobLevelFormValues>({
    resolver: zodResolver(jobLevelSchema),
    defaultValues: { name: '', rank: nextRank },
  });

  const handleAdd = handleSubmit(async (values) => {
    await onAdd(values);
    reset({ name: '', rank: values.rank + 1 });
    setShowForm(false);
  });

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobLevels.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
          <Layers className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500 text-center mb-3">Noch keine Karrierestufen angelegt</p>
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Erste Stufe hinzufügen
          </Button>
        </div>
      )}

      {jobLevels.length > 0 && (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {[...jobLevels].sort((a, b) => a.rank - b.rank).map((level) => (
            <li key={level.id} className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors">
              <span className="flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {level.rank}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-800 truncate">{level.name}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onEdit(level)}
                  aria-label={`${level.name} bearbeiten`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDelete(level)}
                  aria-label={`${level.name} löschen`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
          <div className="space-y-1">
            <Label htmlFor="level-name" className="text-xs">
              Name *
            </Label>
            <Input
              id="level-name"
              {...register('name')}
              placeholder="z.B. L1 Junior, Senior, Principal"
              autoFocus
              className="h-8 text-sm"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="level-rank" className="text-xs">
              Rang (Sortierung) *
            </Label>
            <Input
              id="level-rank"
              type="number"
              min={1}
              {...register('rank', { valueAsNumber: true })}
              className="h-8 text-sm"
            />
            {errors.rank && (
              <p className="text-xs text-destructive">{errors.rank.message}</p>
            )}
            <p className="text-xs text-slate-400">Niedrigerer Rang = niedrigere Stufe</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting} className="h-8">
              {isSubmitting ? 'Speichern…' : 'Hinzufügen'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => {
                reset();
                setShowForm(false);
              }}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      ) : (
        jobLevels.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" />
            Weitere Stufe
          </Button>
        )
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function StrukturWorkshopView() {
  const canAccess = useRoleAccess('owner', 'admin', 'hr_manager');

  const {
    departments,
    loading: depsLoading,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    fetchDepartments,
  } = useDepartments();

  const {
    jobLevels,
    loading: levelsLoading,
    createJobLevel,
    updateJobLevel,
    deleteJobLevel,
    fetchJobLevels,
  } = useJobLevels();

  // Edit state — departments
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [editDeptName, setEditDeptName] = useState('');

  // Edit state — job levels
  const [editLevel, setEditLevel] = useState<JobLevel | null>(null);
  const [editLevelName, setEditLevelName] = useState('');
  const [editLevelRank, setEditLevelRank] = useState(1);

  // Delete confirmations
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [deleteLevel, setDeleteLevel] = useState<JobLevel | null>(null);

  // Template bulk-apply state
  const [isApplying, setIsApplying] = useState(false);

  const isLoading = depsLoading || levelsLoading;
  const bothEmpty = departments.length === 0 && jobLevels.length === 0;
  const canProceed = departments.length >= 1 && jobLevels.length >= 1;

  if (!canAccess) {
    return <AccessDenied />;
  }

  // ── Template apply ──────────────────────────────────────────────────────────

  async function handleApplyTemplate() {
    if (!bothEmpty) return; // guard: only when both lists are empty

    const template = SETUP_TEMPLATES['tech-startup'];
    setIsApplying(true);

    let deptOk = 0;
    let deptFail = 0;
    let levelOk = 0;
    let levelFail = 0;

    for (const dept of template.departments) {
      try {
        const res = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: dept.name }),
        });
        if (!res.ok) throw new Error(await res.text());
        deptOk++;
      } catch {
        deptFail++;
      }
    }

    for (const level of template.jobLevels) {
      try {
        const res = await fetch('/api/job-levels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: level.name, rank: level.rank }),
        });
        if (!res.ok) throw new Error(await res.text());
        levelOk++;
      } catch {
        levelFail++;
      }
    }

    await Promise.all([fetchDepartments(), fetchJobLevels()]);
    setIsApplying(false);

    const totalFail = deptFail + levelFail;
    if (totalFail === 0) {
      toast.success(
        `Vorlage angewendet: ${deptOk} Abteilungen und ${levelOk} Karrierestufen angelegt.`
      );
    } else {
      toast.error(
        `${deptOk + levelOk} von ${template.departments.length + template.jobLevels.length} Einträgen angelegt — ${totalFail} Fehler. Bitte manuell prüfen.`
      );
    }
  }

  // ── Department CRUD handlers ────────────────────────────────────────────────

  async function handleAddDepartment(values: DepartmentFormValues) {
    await createDepartment({ name: values.name, parent_id: null });
  }

  async function handleUpdateDepartment() {
    if (!editDept || !editDeptName.trim()) return;
    await updateDepartment(editDept.id, { name: editDeptName.trim() });
    setEditDept(null);
  }

  async function handleConfirmDeleteDept() {
    if (!deleteDept) return;
    await deleteDepartment(deleteDept.id);
    setDeleteDept(null);
  }

  // ── Job level CRUD handlers ─────────────────────────────────────────────────

  async function handleAddJobLevel(values: JobLevelFormValues) {
    await createJobLevel({ name: values.name, rank: values.rank });
  }

  async function handleUpdateJobLevel() {
    if (!editLevel || !editLevelName.trim()) return;
    await updateJobLevel(editLevel.id, { name: editLevelName.trim(), rank: editLevelRank });
    setEditLevel(null);
  }

  async function handleConfirmDeleteLevel() {
    if (!deleteLevel) return;
    await deleteJobLevel(deleteLevel.id);
    setDeleteLevel(null);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb + header */}
      <div>
        <Link
          href="/einrichtung"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Compliance-Einrichtung
        </Link>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-semibold">
            1
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Phase 1: Struktur</h1>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-2xl">
              Definiere zuerst die Abteilungen und Karrierestufen — die Vergleichsgruppen, auf denen alles
              aufbaut. Ohne diese Basis können Gehaltsgruppen nicht analysiert werden (Art.&nbsp;9,&nbsp;10 EU-Richtlinie 2023/970).
            </p>
          </div>
        </div>
      </div>

      {/* Template card — only when both lists are empty */}
      {!isLoading && bothEmpty && (
        <TemplateBulkApplyCard onApply={handleApplyTemplate} isApplying={isApplying} />
      )}

      {/* Side-by-side columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-500" />
                <CardTitle className="text-base">Abteilungen</CardTitle>
              </div>
              {departments.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">{departments.length} angelegt</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              Vergleichsgruppen nach Art. 9 EU-Richtlinie. Jede Abteilung wird später zur Eingruppierung
              von Mitarbeitenden verwendet.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <DepartmentsColumn
              departments={departments}
              loading={depsLoading}
              onAdd={handleAddDepartment}
              onEdit={(dept) => {
                setEditDept(dept);
                setEditDeptName(dept.name);
              }}
              onDelete={(dept) => setDeleteDept(dept)}
            />
          </CardContent>
        </Card>

        {/* Job levels */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-500" />
                <CardTitle className="text-base">Karrierestufen</CardTitle>
              </div>
              {jobLevels.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">{jobLevels.length} angelegt</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              Pflichtbestandteil der Entgeltbewertung nach Art. 10 — ohne Stufen können keine Gehaltsbänder
              zugeordnet werden.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <JobLevelsColumn
              jobLevels={jobLevels}
              loading={levelsLoading}
              onAdd={handleAddJobLevel}
              onEdit={(level) => {
                setEditLevel(level);
                setEditLevelName(level.name);
                setEditLevelRank(level.rank);
              }}
              onDelete={(level) => setDeleteLevel(level)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="text-sm text-slate-500">
          {canProceed ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Phase 1 abgeschlossen — weiter zu Phase 2
            </span>
          ) : (
            <span>
              Noch benötigt:{' '}
              {[
                departments.length === 0 && 'min. 1 Abteilung',
                jobLevels.length === 0 && 'min. 1 Karrierestufe',
              ]
                .filter(Boolean)
                .join(' und ')}
            </span>
          )}
        </div>
        <Link href="/einrichtung/verguetung">
          <Button disabled={!canProceed} variant={canProceed ? 'default' : 'outline'}>
            Weiter zu Phase 2 (Vergütung)
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Edit department dialog */}
      <Dialog
        open={editDept !== null}
        onOpenChange={(open) => {
          if (!open) setEditDept(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abteilung bearbeiten</DialogTitle>
            <DialogDescription>Namen der Abteilung anpassen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="edit-dept-name">Name *</Label>
              <Input
                id="edit-dept-name"
                value={editDeptName}
                onChange={(e) => setEditDeptName(e.target.value)}
                placeholder="Abteilungsname"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditDept(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleUpdateDepartment}
              disabled={!editDeptName.trim()}
            >
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit job level dialog */}
      <Dialog
        open={editLevel !== null}
        onOpenChange={(open) => {
          if (!open) setEditLevel(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Karrierestufe bearbeiten</DialogTitle>
            <DialogDescription>Name und Rang der Stufe anpassen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="edit-level-name">Name *</Label>
              <Input
                id="edit-level-name"
                value={editLevelName}
                onChange={(e) => setEditLevelName(e.target.value)}
                placeholder="Stufenname"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-level-rank">Rang</Label>
              <Input
                id="edit-level-rank"
                type="number"
                min={1}
                value={editLevelRank}
                onChange={(e) => setEditLevelRank(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-slate-400">Niedrigerer Rang = niedrigere Stufe</p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditLevel(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleUpdateJobLevel}
              disabled={!editLevelName.trim()}
            >
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete department confirm */}
      <AlertDialog
        open={deleteDept !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteDept(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abteilung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Abteilung &quot;{deleteDept?.name}&quot; wird gelöscht. Mitarbeiter und Job-Profile, die dieser
              Abteilung zugeordnet sind, verlieren ihre Zuordnung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteDept}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete job level confirm */}
      <AlertDialog
        open={deleteLevel !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteLevel(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Karrierestufe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Stufe &quot;{deleteLevel?.name}&quot; wird gelöscht. Gehaltsbänder und Mitarbeiter, die dieser Stufe
              zugeordnet sind, verlieren ihre Zuordnung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteLevel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
