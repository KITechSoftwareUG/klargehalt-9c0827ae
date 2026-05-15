'use client';

import { useState } from 'react';
import { useJobProfiles } from '@/hooks/useJobProfiles';
import { useDepartments } from '@/hooks/useDepartments';
import { InlineCreateSelect, InlineCreateSelectItem } from '@/components/ui/InlineCreateSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface InlineCreateJobProfileSelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  canCreate?: boolean;
  placeholder?: string;
  /** Pre-select this department_id in the inline create dialog */
  preselectedDepartmentId?: string | null;
}

export function InlineCreateJobProfileSelect({
  value,
  onChange,
  disabled = false,
  canCreate = true,
  placeholder = 'Auswählen',
  preselectedDepartmentId,
}: InlineCreateJobProfileSelectProps) {
  const { jobProfiles, createJobProfile } = useJobProfiles();
  const { departments } = useDepartments();

  // Department selection inside the inline create dialog
  const [newDeptId, setNewDeptId] = useState<string | null>(preselectedDepartmentId ?? null);

  const items: InlineCreateSelectItem[] = jobProfiles.map((p) => ({
    id: p.id,
    label: p.title,
  }));

  const handleCreate = async (title: string): Promise<{ id: string; label: string } | null> => {
    const created = await createJobProfile({
      title,
      department_id: newDeptId || null,
      is_active: true,
    });
    if (!created) return null;
    return { id: created.id, label: created.title };
  };

  const handleDialogOpen = () => {
    setNewDeptId(preselectedDepartmentId ?? null);
  };

  const deptExtra = (
    <div className="grid gap-2">
      <Label className="text-sm font-medium">Abteilung</Label>
      <Select
        value={newDeptId || 'none'}
        onValueChange={(v) => setNewDeptId(v === 'none' ? null : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="— Keine —" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">— Keine —</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <InlineCreateSelect
      value={value}
      onChange={onChange}
      items={items}
      placeholder={placeholder}
      disabled={disabled}
      noneLabel="— Keines —"
      onCreate={canCreate ? handleCreate : undefined}
      createLabel="+ Neues Job-Profil anlegen…"
      canCreate={canCreate}
      createDialogExtra={deptExtra}
      onCreateDialogOpen={handleDialogOpen}
    />
  );
}
