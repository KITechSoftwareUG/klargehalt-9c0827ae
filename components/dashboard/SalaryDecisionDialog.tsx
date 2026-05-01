'use client';

import { useState } from 'react';
import { useSalaryDecisions, SalaryDecisionFormData, JustificationFactor } from '@/hooks/useSalaryDecisions';
import type { Employee } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, Euro, X, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DECISION_TYPE_LABELS: Record<string, string> = {
  hire:        'Einstellung',
  raise:       'Gehaltserhöhung',
  promotion:   'Beförderung',
  band_change: 'Bandwechsel',
  correction:  'Korrektur',
};

const DECISION_TYPE_COLORS: Record<string, string> = {
  hire:        'bg-blue-100 text-blue-800',
  raise:       'bg-green-100 text-green-800',
  promotion:   'bg-purple-100 text-purple-800',
  band_change: 'bg-amber-100 text-amber-800',
  correction:  'bg-red-100 text-red-800',
};

const FACTOR_TYPE_LABELS: Record<string, string> = {
  experience:  'Berufserfahrung',
  education:   'Ausbildung',
  performance: 'Leistung',
  market_rate: 'Marktgehalt',
  seniority:   'Betriebszugehörigkeit',
  other:       'Sonstiges',
};

const formatCurrency = (value: number | null | undefined) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

interface Props {
  employee: Employee;
  open: boolean;
  onClose: () => void;
}

export function SalaryDecisionDialog({ employee, open, onClose }: Props) {
  const { decisions, loading, createDecision } = useSalaryDecisions(employee.id);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<SalaryDecisionFormData>({
    employee_id: employee.id,
    decision_type: 'raise',
    old_salary: employee.base_salary,
    new_salary: employee.base_salary,
    justification_text: '',
    justification_factors: [],
  });

  const addFactor = () => {
    setForm(prev => ({
      ...prev,
      justification_factors: [
        ...(prev.justification_factors ?? []),
        { type: 'experience', weight: 0.5, score: 3 },
      ],
    }));
  };

  const updateFactor = (index: number, patch: Partial<JustificationFactor>) => {
    setForm(prev => ({
      ...prev,
      justification_factors: (prev.justification_factors ?? []).map((f, i) =>
        i === index ? { ...f, ...patch } : f
      ),
    }));
  };

  const removeFactor = (index: number) => {
    setForm(prev => ({
      ...prev,
      justification_factors: (prev.justification_factors ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await createDecision(form);
    setSaving(false);
    if (result) {
      setShowForm(false);
      setForm({
        employee_id: employee.id,
        decision_type: 'raise',
        old_salary: employee.base_salary,
        new_salary: employee.base_salary,
        justification_text: '',
        justification_factors: [],
      });
    }
  };

  const canSave =
    form.justification_text.length >= 10 &&
    form.new_salary > 0;

  const salaryDelta = form.new_salary - (form.old_salary ?? form.new_salary);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Gehaltsentscheidungen — {employee.first_name} {employee.last_name}
          </DialogTitle>
          <DialogDescription>
            Append-only Entscheidungsprotokoll gemäß EU-Richtlinie 2023/970 Art. 16. Einmal
            gespeicherte Einträge sind unveränderlich.
          </DialogDescription>
        </DialogHeader>

        {/* History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Entscheidungshistorie</span>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="w-3 h-3 mr-1" />
                Neue Entscheidung
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : decisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl text-muted-foreground">
              <FileText className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Noch keine Entscheidungen dokumentiert</p>
              <p className="text-xs mt-1 opacity-70">
                Jede Gehaltsänderung muss hier begründet werden.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {decisions.map(d => {
                const delta = d.old_salary != null ? d.new_salary - d.old_salary : null;
                return (
                  <div key={d.id} className="rounded-lg border p-3 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${DECISION_TYPE_COLORS[d.decision_type]}`}>
                          {DECISION_TYPE_LABELS[d.decision_type]}
                        </span>
                        <span className="text-sm font-mono font-medium">{formatCurrency(d.new_salary)}</span>
                        {delta != null && (
                          <span className={`text-xs font-medium flex items-center gap-0.5 ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {delta > 0 ? '+' : ''}{formatCurrency(delta)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(d.decided_at).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{d.justification_text}</p>
                    {d.lawyer_review_id && (
                      <Badge variant="outline" className="mt-1 text-xs border-primary/40 text-primary">
                        Anwaltlich geprüft
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New Decision Form */}
        {showForm && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Neue Entscheidung dokumentieren</span>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Entscheidungstyp *</Label>
                <Select value={form.decision_type} onValueChange={(v: SalaryDecisionFormData['decision_type']) => setForm(p => ({ ...p, decision_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DECISION_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Datum der Entscheidung</Label>
                <Input
                  type="date"
                  value={form.decided_at ? form.decided_at.split('T')[0] : new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(p => ({ ...p, decided_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Bisheriges Gehalt</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    className="pl-10"
                    value={form.old_salary ?? ''}
                    onChange={e => setForm(p => ({ ...p, old_salary: parseFloat(e.target.value) || null }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Neues Gehalt *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    className="pl-10"
                    value={form.new_salary || ''}
                    onChange={e => setForm(p => ({ ...p, new_salary: parseFloat(e.target.value) || 0 }))}
                    placeholder="50.000"
                  />
                </div>
                {salaryDelta !== 0 && (
                  <p className={`text-xs font-medium ${salaryDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {salaryDelta > 0 ? '+' : ''}{formatCurrency(salaryDelta)} ({salaryDelta > 0 ? '+' : ''}{(form.old_salary ? (salaryDelta / form.old_salary * 100) : 0).toFixed(1)}%)
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Begründung * <span className="text-xs text-muted-foreground">(min. 10 Zeichen)</span></Label>
              <Textarea
                placeholder="Begründen Sie die Entscheidung transparent und nachvollziehbar gemäß Art. 16 der EU-Richtlinie 2023/970..."
                rows={3}
                value={form.justification_text}
                onChange={e => setForm(p => ({ ...p, justification_text: e.target.value }))}
              />
              {form.justification_text.length > 0 && form.justification_text.length < 10 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Mindestens {10 - form.justification_text.length} weitere Zeichen erforderlich
                </p>
              )}
            </div>

            {/* Justification Factors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Bewertungsfaktoren</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFactor}>
                  <Plus className="w-3 h-3 mr-1" />
                  Faktor
                </Button>
              </div>
              {(form.justification_factors ?? []).map((factor, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 p-2 rounded border bg-muted/30">
                  <Select value={factor.type} onValueChange={v => updateFactor(i, { type: v as JustificationFactor['type'] })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FACTOR_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number" min={1} max={5} step={1}
                    className="h-8 text-xs"
                    placeholder="Score 1-5"
                    value={factor.score}
                    onChange={e => updateFactor(i, { score: parseInt(e.target.value) || 3 })}
                  />
                  <div className="flex gap-1">
                    <Input
                      type="number" min={0} max={1} step={0.1}
                      className="h-8 text-xs"
                      placeholder="Gewicht"
                      value={factor.weight}
                      onChange={e => updateFactor(i, { weight: parseFloat(e.target.value) || 0 })}
                    />
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => removeFactor(i)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={!canSave || saving}>
                {saving ? 'Speichere…' : 'Entscheidung dokumentieren'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
