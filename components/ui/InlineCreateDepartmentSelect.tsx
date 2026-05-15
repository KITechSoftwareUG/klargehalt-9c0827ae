'use client';

import { useDepartments } from '@/hooks/useDepartments';
import { InlineCreateSelect, InlineCreateSelectItem } from '@/components/ui/InlineCreateSelect';

interface InlineCreateDepartmentSelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  canCreate?: boolean;
  placeholder?: string;
}

export function InlineCreateDepartmentSelect({
  value,
  onChange,
  disabled = false,
  canCreate = true,
  placeholder = 'Auswählen',
}: InlineCreateDepartmentSelectProps) {
  const { departments, createDepartment } = useDepartments();

  const items: InlineCreateSelectItem[] = departments.map((d) => ({
    id: d.id,
    label: d.name,
  }));

  const handleCreate = async (name: string): Promise<{ id: string; label: string } | null> => {
    const created = await createDepartment({ name });
    if (!created) return null;
    return { id: created.id, label: created.name };
  };

  return (
    <InlineCreateSelect
      value={value}
      onChange={onChange}
      items={items}
      placeholder={placeholder}
      disabled={disabled}
      noneLabel="— Keine —"
      onCreate={canCreate ? handleCreate : undefined}
      createLabel="+ Neue Abteilung anlegen…"
      canCreate={canCreate}
    />
  );
}
