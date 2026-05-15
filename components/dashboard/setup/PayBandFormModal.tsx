'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type PayBand } from '@/hooks/useJobProfiles';

// ─── Schema ───────────────────────────────────────────────────────────────────

const payBandSchema = z
  .object({
    min_salary: z
      .number({ invalid_type_error: 'Mindestgehalt muss eine Zahl sein' })
      .positive('Mindestgehalt muss größer als 0 sein'),
    max_salary: z
      .number({ invalid_type_error: 'Höchstgehalt muss eine Zahl sein' })
      .positive('Höchstgehalt muss größer als 0 sein'),
    currency: z.enum(['EUR', 'USD', 'CHF', 'GBP'], {
      required_error: 'Währung ist erforderlich',
    }),
    effective_from: z.string().min(1, 'Startdatum ist erforderlich'),
    effective_to: z.string().optional(),
  })
  .refine((data) => data.max_salary >= data.min_salary, {
    message: 'Höchstgehalt muss ≥ Mindestgehalt sein',
    path: ['max_salary'],
  })
  .refine(
    (data) => {
      if (!data.effective_to) return true;
      return data.effective_to > data.effective_from;
    },
    {
      message: 'Enddatum muss nach dem Startdatum liegen',
      path: ['effective_to'],
    }
  );

type PayBandFormValues = z.infer<typeof payBandSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface PayBandFormModalProps {
  mode: 'create' | 'edit';
  payBand?: PayBand;
  jobProfileId: string;
  jobLevelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PayBandFormModal({
  mode,
  payBand,
  jobProfileId,
  jobLevelId,
  open,
  onOpenChange,
  onSaved,
}: PayBandFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PayBandFormValues>({
    resolver: zodResolver(payBandSchema),
    defaultValues: {
      min_salary: undefined,
      max_salary: undefined,
      currency: 'EUR',
      effective_from: todayIso(),
      effective_to: '',
    },
  });

  // Sync form values when editing an existing band
  useEffect(() => {
    if (mode === 'edit' && payBand) {
      reset({
        min_salary: payBand.min_salary,
        max_salary: payBand.max_salary,
        currency: payBand.currency as PayBandFormValues['currency'],
        effective_from: payBand.effective_from.slice(0, 10),
        effective_to: payBand.effective_to ? payBand.effective_to.slice(0, 10) : '',
      });
    } else if (mode === 'create') {
      reset({
        min_salary: undefined,
        max_salary: undefined,
        currency: 'EUR',
        effective_from: todayIso(),
        effective_to: '',
      });
    }
  }, [mode, payBand, reset, open]);

  const onSubmit = handleSubmit(async (values) => {
    const body = {
      job_profile_id: jobProfileId,
      job_level_id: jobLevelId,
      min_salary: values.min_salary,
      max_salary: values.max_salary,
      currency: values.currency,
      effective_from: values.effective_from,
      effective_to: values.effective_to || null,
    };

    if (mode === 'edit' && payBand) {
      const res = await fetch(`/api/pay-bands/${payBand.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        toast.error(`Fehler beim Aktualisieren: ${text}`);
        return;
      }

      toast.success('Gehaltsband aktualisiert');
    } else {
      const res = await fetch('/api/pay-bands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        // Detect UNIQUE constraint violation on (org, profile, level, effective_from)
        if (text.includes('unique') || text.includes('duplicate') || res.status === 409 || res.status === 500) {
          toast.error(
            'Es existiert bereits ein Band für diese Kombination ab diesem Datum. Wähle ein anderes Startdatum oder bearbeite das bestehende Band.'
          );
        } else {
          toast.error(`Fehler beim Anlegen: ${text}`);
        }
        return;
      }

      toast.success('Gehaltsband angelegt');
    }

    onSaved();
    onOpenChange(false);
  });

  const title = mode === 'create' ? 'Gehaltsband anlegen' : 'Gehaltsband bearbeiten';
  const description =
    mode === 'create'
      ? 'Lege das Gehaltsband für diese Profil-/Stufenkombination fest.'
      : 'Passe das Gehaltsband an. Für rückwirkende Korrekturen empfiehlt sich ein neues Band mit neuem Startdatum.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          {/* Min / Max salary side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="min_salary" className="text-xs">
                Mindestgehalt *
              </Label>
              <Input
                id="min_salary"
                type="number"
                min={1}
                step={500}
                placeholder="45000"
                className="h-9 text-sm"
                {...register('min_salary', { valueAsNumber: true })}
              />
              {errors.min_salary && (
                <p className="text-xs text-destructive">{errors.min_salary.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="max_salary" className="text-xs">
                Höchstgehalt *
              </Label>
              <Input
                id="max_salary"
                type="number"
                min={1}
                step={500}
                placeholder="55000"
                className="h-9 text-sm"
                {...register('max_salary', { valueAsNumber: true })}
              />
              {errors.max_salary && (
                <p className="text-xs text-destructive">{errors.max_salary.message}</p>
              )}
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-1">
            <Label className="text-xs">Währung *</Label>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Währung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                    <SelectItem value="USD">USD — US-Dollar ($)</SelectItem>
                    <SelectItem value="CHF">CHF — Schweizer Franken</SelectItem>
                    <SelectItem value="GBP">GBP — Britisches Pfund (£)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.currency && (
              <p className="text-xs text-destructive">{errors.currency.message}</p>
            )}
          </div>

          {/* Effective from / to */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="effective_from" className="text-xs">
                Gültig ab *
              </Label>
              <Input
                id="effective_from"
                type="date"
                className="h-9 text-sm"
                {...register('effective_from')}
              />
              {errors.effective_from && (
                <p className="text-xs text-destructive">{errors.effective_from.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="effective_to" className="text-xs">
                Gültig bis (optional)
              </Label>
              <Input
                id="effective_to"
                type="date"
                className="h-9 text-sm"
                {...register('effective_to')}
              />
              {errors.effective_to && (
                <p className="text-xs text-destructive">{errors.effective_to.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Speichern…' : mode === 'create' ? 'Anlegen' : 'Aktualisieren'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
