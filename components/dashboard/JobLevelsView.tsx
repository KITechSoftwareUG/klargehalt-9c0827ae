import { useState } from 'react';
import { useJobLevels, JobLevel, JobLevelFormData } from '@/hooks/useJobLevels';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { SetupStepGuide } from '@/components/dashboard/SetupStepGuide';

const JobLevelsView = () => {
  const { jobLevels, loading, createJobLevel, updateJobLevel, deleteJobLevel } = useJobLevels();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<JobLevel | null>(null);
  const [formData, setFormData] = useState<JobLevelFormData>({
    name: '',
    rank: 1,
  });

  const resetForm = () => {
    const nextRank = jobLevels.length > 0 ? Math.max(...jobLevels.map(l => l.rank)) + 1 : 1;
    setFormData({ name: '', rank: nextRank });
  };

  const handleCreate = async () => {
    await createJobLevel(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (level: JobLevel) => {
    setSelectedLevel(level);
    setFormData({ name: level.name, rank: level.rank });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedLevel) return;
    await updateJobLevel(selectedLevel.id, formData);
    setIsEditOpen(false);
    setSelectedLevel(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedLevel) return;
    await deleteJobLevel(selectedLevel.id);
    setIsDeleteOpen(false);
    setSelectedLevel(null);
  };

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="z.B. Junior, Mid-Level, Senior, Lead"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="rank">Rang (Sortierung) *</Label>
        <Input
          id="rank"
          type="number"
          min={1}
          value={formData.rank}
          onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) || 1 })}
        />
        <p className="text-xs text-muted-foreground">
          Niedrigerer Rang = niedrigere Stufe. z.B. Junior=1, Mid=2, Senior=3
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Karrierestufen</h2>
          <p className="text-muted-foreground">Definieren Sie die Karrierestufen Ihres Unternehmens</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Neue Stufe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Karrierestufe erstellen</DialogTitle>
              <DialogDescription>
                Definieren Sie eine neue Karrierestufe für Gehaltsbänder und Mitarbeiter.
              </DialogDescription>
            </DialogHeader>
            {FormFields()}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Abbrechen</Button>
              <Button variant="hero" onClick={handleCreate} disabled={!formData.name.trim()}>Erstellen</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {jobLevels.length === 0 && (
        <SetupStepGuide
          icon={Layers}
          title="Karrierestufen festlegen"
          complianceNote="Karrierestufen ermöglichen die Bewertung von Lohnunterschieden innerhalb gleicher Tätigkeitsgruppen gemäß Art. 10 der Richtlinie. Sie sind Pflichtbestandteil der Entgeltbewertung."
          stepNumber={2}
          totalSteps={5}
        />
      )}
      {jobLevels.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
          <Layers className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Keine Karrierestufen vorhanden</h3>
          <p className="text-muted-foreground text-center mb-4">
            Definieren Sie Karrierestufen (z.B. Junior, Mid, Senior), um Gehaltsbänder zuordnen zu können.
          </p>
          <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Erste Stufe erstellen
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Rang</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobLevels.map((level) => (
                <TableRow key={level.id}>
                  <TableCell>
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {level.rank}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{level.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(level)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedLevel(level); setIsDeleteOpen(true); }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Karrierestufe bearbeiten</DialogTitle>
            <DialogDescription>Aktualisieren Sie die Stufendaten.</DialogDescription>
          </DialogHeader>
          {FormFields()}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Abbrechen</Button>
            <Button variant="hero" onClick={handleUpdate} disabled={!formData.name.trim()}>Speichern</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Karrierestufe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie die Stufe &quot;{selectedLevel?.name}&quot; löschen möchten?
              Gehaltsbänder und Mitarbeiter, die dieser Stufe zugeordnet sind, verlieren ihre Zuordnung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JobLevelsView;
