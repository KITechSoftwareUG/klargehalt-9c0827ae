'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface InlineCreateSelectItem {
  id: string;
  label: string;
}

interface InlineCreateSelectProps<T extends InlineCreateSelectItem> {
  value: string | null;
  onChange: (id: string | null) => void;
  items: T[];
  placeholder?: string;
  disabled?: boolean;
  /** Label for the "none" option. If omitted, no none-option is shown. */
  noneLabel?: string;
  /** If provided, a "+ Neue X anlegen…" option appears at the bottom of the list. */
  onCreate?: (name: string) => Promise<{ id: string; label: string } | null>;
  createLabel?: string;
  /** Controls whether the create option is rendered. Defaults to true when onCreate is provided. */
  canCreate?: boolean;
  /** Extra content rendered inside the create-dialog below the name input */
  createDialogExtra?: React.ReactNode;
  /** Called when the dialog opens so the parent can reset extra fields */
  onCreateDialogOpen?: () => void;
}

const INLINE_CREATE_SENTINEL = '__inline_create__';

export function InlineCreateSelect<T extends InlineCreateSelectItem>({
  value,
  onChange,
  items,
  placeholder = 'Auswählen',
  disabled = false,
  noneLabel,
  onCreate,
  createLabel = '+ Neu anlegen…',
  canCreate = true,
  createDialogExtra,
  onCreateDialogOpen,
}: InlineCreateSelectProps<T>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const showCreateOption = !!onCreate && canCreate;

  const handleSelectChange = (selected: string) => {
    if (selected === INLINE_CREATE_SENTINEL) {
      setNameValue('');
      onCreateDialogOpen?.();
      setDialogOpen(true);
      return;
    }
    if (noneLabel && selected === 'none') {
      onChange(null);
      return;
    }
    onChange(selected);
  };

  const handleCreate = async () => {
    if (!onCreate || !nameValue.trim()) return;
    setCreating(true);
    try {
      const result = await onCreate(nameValue.trim());
      if (result) {
        onChange(result.id);
        setDialogOpen(false);
        setNameValue('');
      }
    } finally {
      setCreating(false);
    }
  };

  const selectValue = value === null ? (noneLabel ? 'none' : '') : (value || '');

  return (
    <>
      <Select
        value={selectValue}
        onValueChange={handleSelectChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {noneLabel && (
            <SelectItem value="none">{noneLabel}</SelectItem>
          )}
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
          {showCreateOption && (
            <>
              {items.length > 0 && <SelectSeparator />}
              <SelectItem value={INLINE_CREATE_SENTINEL} className="text-primary font-medium">
                <span className="flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  {createLabel}
                </span>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{createLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <label htmlFor="inline-create-name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="inline-create-name"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); void handleCreate(); }
                }}
                placeholder="Name eingeben…"
                autoFocus
              />
            </div>
            {createDialogExtra}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={creating}
              >
                Abbrechen
              </Button>
              <Button
                size="sm"
                onClick={() => void handleCreate()}
                disabled={!nameValue.trim() || creating}
              >
                {creating ? 'Erstelle…' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
