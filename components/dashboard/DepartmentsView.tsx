import { useState } from 'react';
import { useDepartments, Department, DepartmentFormData } from '@/hooks/useDepartments';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Pencil, Trash2, Building } from 'lucide-react';
import { SetupStepGuide } from '@/components/dashboard/SetupStepGuide';

const DepartmentsView = () => {
  const { departments, loading, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    parent_id: null,
  });

  const resetForm = () => {
    setFormData({ name: '', parent_id: null });
  };

  const handleCreate = async () => {
    await createDepartment(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      parent_id: dept.parent_id,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedDept) return;
    await updateDepartment(selectedDept.id, formData);
    setIsEditOpen(false);
    setSelectedDept(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedDept) return;
    await deleteDepartment(selectedDept.id);
    setIsDeleteOpen(false);
    setSelectedDept(null);
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '—';
    const parent = departments.find(d => d.id === parentId);
    return parent?.name || '—';
  };

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="z.B. IT, HR, Vertrieb"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="parent">Übergeordnete Abteilung (optional)</Label>
        <Select
          value={formData.parent_id || 'none'}
          onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? null : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Keine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keine (Top-Level)</SelectItem>
            {departments
              .filter(d => d.id !== selectedDept?.id)
              .map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
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
          <h2 className="text-2xl font-bold text-foreground">Abteilungen</h2>
          <p className="text-muted-foreground">Verwalten Sie die Abteilungsstruktur Ihres Unternehmens</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Neue Abteilung
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Abteilung erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie eine neue Abteilung für Ihre Organisationsstruktur.
              </DialogDescription>
            </DialogHeader>
            {FormFields()}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button variant="hero" onClick={handleCreate} disabled={!formData.name.trim()}>
                Erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {departments.length === 0 && (
        <SetupStepGuide
          icon={Building}
          title="Unternehmensstruktur definieren"
          complianceNote="Abteilungen sind die Grundlage für Vergleichsgruppen nach Art. 9 EU-Entgelttransparenzrichtlinie. Ohne Struktur können keine Gehaltsgruppen analysiert werden."
          stepNumber={1}
          totalSteps={5}
        />
      )}
      {departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Keine Abteilungen vorhanden</h3>
          <p className="text-muted-foreground text-center mb-4">
            Erstellen Sie Ihre erste Abteilung, um Mitarbeiter zuordnen zu können.
          </p>
          <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Erste Abteilung erstellen
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Übergeordnete Abteilung</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{getParentName(dept.parent_id)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(dept)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedDept(dept); setIsDeleteOpen(true); }}
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
            <DialogTitle>Abteilung bearbeiten</DialogTitle>
            <DialogDescription>Aktualisieren Sie die Abteilungsdaten.</DialogDescription>
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
            <AlertDialogTitle>Abteilung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie die Abteilung &quot;{selectedDept?.name}&quot; löschen möchten?
              Mitarbeiter und Job-Profile, die dieser Abteilung zugeordnet sind, verlieren ihre Zuordnung.
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

export default DepartmentsView;
