'use client';

import { useState } from 'react';
import { useJobLevels } from '@/hooks/useJobLevels';
import { InlineCreateSelect, InlineCreateSelectItem } from '@/components/ui/InlineCreateSelect';
import { Label } from '@/components/ui/label';

interface InlineCreateJobLevelSelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  canCreate?: boolean;
  placeholder?: string;
}

export function InlineCreateJobLevelSelect({
  value,
  onChange,
  disabled = false,
  canCreate = true,
  placeholder = 'Auswählen',
}: InlineCreateJobLevelSelectProps) {
  const { jobLevels, createJobLevel } = useJobLevels();

  // Auto-suggest rank = max existing rank + 1
  const nextRank = jobLevels.length > 0
    ? Math.max(...jobLevels.map((l) => l.rank)) + 1
    : 1;
  const [rankValue, setRankValue] = useState<number>(nextRank);

  const items: InlineCreateSelectItem[] = jobLevels
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map((l) => ({
      id: l.id,
      label: `${l.name} (Rang ${l.rank})`,
    }));

  const handleCreate = async (name: string): Promise<{ id: string; label: string } | null> => {
    const created = await createJobLevel({ name, rank: rankValue });
    if (!created) return null;
    return { id: created.id, label: `${created.name} (Rang ${created.rank})` };
  };

  const handleDialogOpen = () => {
    const newNextRank = jobLevels.length > 0
      ? Math.max(...jobLevels.map((l) => l.rank)) + 1
      : 1;
    setRankValue(newNextRank);
  };

  const rankExtra = (
    <div className="grid gap-2">
      <Label htmlFor="inline-level-rank" className="text-sm font-medium">
        Rang (Hierarchie)
      </Label>
      <input
        id="inline-level-rank"
        type="number"
        min={1}
        max={99}
        step={1}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={rankValue}
        onChange={(e) => setRankValue(parseInt(e.target.value) || 1)}
      />
      <p className="text-xs text-muted-foreground">
        Niedrige Zahl = niedrige Stufe. Automatisch auf {nextRank} gesetzt.
      </p>
    </div>
  );

  return (
    <InlineCreateSelect
      value={value}
      onChange={onChange}
      items={items}
      placeholder={placeholder}
      disabled={disabled}
      noneLabel="— Keine —"
      onCreate={canCreate ? handleCreate : undefined}
      createLabel="+ Neue Karrierestufe anlegen…"
      canCreate={canCreate}
      createDialogExtra={rankExtra}
      onCreateDialogOpen={handleDialogOpen}
    />
  );
}
