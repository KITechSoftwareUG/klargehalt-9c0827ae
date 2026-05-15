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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type JobProfile } from '@/hooks/useJobProfiles';
import { type Department } from '@/hooks/useDepartments';

// ─── Schema ───────────────────────────────────────────────────────────────────

const jobProfileSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(200, 'Maximal 200 Zeichen'),
  description: z.string().max(2000, 'Maximal 2000 Zeichen').optional(),
  department_id: z.string().min(1, 'Abteilung ist erforderlich'),
});

type JobProfileFormValues = z.infer<typeof jobProfileSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface JobProfileFormModalProps {
  mode: 'create' | 'edit';
  jobProfile?: JobProfile;
  defaultDepartmentId?: string;
  departments: Department[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function JobProfileFormModal({
  mode,
  jobProfile,
  defaultDepartmentId,
  departments,
  open,
  onOpenChange,
  onSaved,
}: JobProfileFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobProfileFormValues>({
    resolver: zodResolver(jobProfileSchema),
    defaultValues: {
      title: '',
      description: '',
      department_id: defaultDepartmentId ?? '',
    },
  });

  // Sync form values when modal opens
  useEffect(() => {
    if (mode === 'edit' && jobProfile) {
      reset({
        title: jobProfile.title,
        description: jobProfile.description ?? '',
        department_id: jobProfile.department_id ?? '',
      });
    } else {
      reset({
        title: '',
        description: '',
        department_id: defaultDepartmentId ?? '',
      });
    }
  }, [mode, jobProfile, defaultDepartmentId, reset, open]);

  const onSubmit = handleSubmit(async (values) => {
    const body = {
      title: values.title,
      description: values.description || null,
      department_id: values.department_id,
      is_active: true,
    };

    if (mode === 'edit' && jobProfile) {
      const res = await fetch(`/api/job-profiles/${jobProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        toast.error(`Fehler beim Aktualisieren: ${text}`);
        return;
      }

      toast.success('Job-Profil aktualisiert');
    } else {
      const res = await fetch('/api/job-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        toast.error(`Fehler beim Anlegen: ${text}`);
        return;
      }

      toast.success('Job-Profil angelegt');
    }

    onSaved();
    onOpenChange(false);
  });

  const title = mode === 'create' ? 'Job-Profil anlegen' : 'Job-Profil bearbeiten';
  const description =
    mode === 'create'
      ? 'Definiere ein Tätigkeitsprofil für eine Rolle in deiner Organisation. EU-Bewertungsscores werden in einem späteren Schritt ergänzt.'
      : 'Passe den Titel, die Beschreibung oder die Abteilung dieses Profils an.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="profile-title" className="text-xs">
              Bezeichnung *
            </Label>
            <Input
              id="profile-title"
              placeholder="z.B. Software Engineer, Product Manager"
              className="h-9 text-sm"
              autoFocus
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Department */}
          <div className="space-y-1">
            <Label className="text-xs">Abteilung *</Label>
            <Controller
              control={control}
              name="department_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Abteilung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.department_id && (
              <p className="text-xs text-destructive">{errors.department_id.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="profile-description" className="text-xs">
              Beschreibung (optional)
            </Label>
            <Textarea
              id="profile-description"
              placeholder="Kurze Beschreibung der Tätigkeiten und Verantwortlichkeiten…"
              className="text-sm resize-none"
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
            <p className="text-xs text-slate-400">
              EU-Bewertungsscores (Einstufungsaufwand, Kompetenzen etc.) werden in einem
              separaten Schritt ergänzt.
            </p>
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
