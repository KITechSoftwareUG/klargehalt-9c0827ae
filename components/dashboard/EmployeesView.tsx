import { useState } from 'react';
import { useEmployees, Employee, EmployeeFormData } from '@/hooks/useEmployees';
import { useJobProfiles } from '@/hooks/useJobProfiles';
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
import { Plus, Pencil, Trash2, Users, CheckCircle, XCircle } from 'lucide-react';

const genderLabels: Record<string, string> = {
  male: 'Männlich',
  female: 'Weiblich',
  diverse: 'Divers',
  not_specified: 'Keine Angabe',
};

const jobLevelLabels: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mid-Level',
  senior: 'Senior',
  lead: 'Lead',
  principal: 'Principal',
  director: 'Director',
};

const EmployeesView = () => {
  const { employees, loading, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { jobProfiles } = useJobProfiles();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    first_name: '',
    last_name: '',
    email: '',
    employee_number: '',
    gender: undefined,
    hire_date: '',
    job_profile_id: '',
    job_level: undefined,
    department: '',
    location: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      employee_number: '',
      gender: undefined,
      hire_date: '',
      job_profile_id: '',
      job_level: undefined,
      department: '',
      location: '',
      is_active: true,
    });
  };

  const handleCreate = async () => {
    await createEmployee(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email || '',
      employee_number: employee.employee_number || '',
      gender: (employee.gender as EmployeeFormData['gender']) || undefined,
      hire_date: employee.hire_date || '',
      job_profile_id: employee.job_profile_id || '',
      job_level: (employee.job_level as EmployeeFormData['job_level']) || undefined,
      department: employee.department || '',
      location: employee.location || '',
      is_active: employee.is_active,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;
    await updateEmployee(selectedEmployee.id, formData);
    setIsEditOpen(false);
    setSelectedEmployee(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    await deleteEmployee(selectedEmployee.id);
    setIsDeleteOpen(false);
    setSelectedEmployee(null);
  };

  const getProfileTitle = (profileId: string | null) => {
    if (!profileId) return '—';
    const profile = jobProfiles.find(p => p.id === profileId);
    return profile?.title || '—';
  };

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="first_name">Vorname *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Max"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="last_name">Nachname *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Mustermann"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="max@firma.de"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="employee_number">Personalnummer</Label>
          <Input
            id="employee_number"
            value={formData.employee_number}
            onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
            placeholder="P-12345"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="gender">Geschlecht</Label>
          <Select
            value={formData.gender || ''}
            onValueChange={(value: EmployeeFormData['gender']) => 
              setFormData({ ...formData, gender: value || undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Männlich</SelectItem>
              <SelectItem value="female">Weiblich</SelectItem>
              <SelectItem value="diverse">Divers</SelectItem>
              <SelectItem value="not_specified">Keine Angabe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="hire_date">Eintrittsdatum</Label>
          <Input
            id="hire_date"
            type="date"
            value={formData.hire_date}
            onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="job_profile">Job-Profil</Label>
          <Select
            value={formData.job_profile_id || ''}
            onValueChange={(value) => setFormData({ ...formData, job_profile_id: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Auswählen" />
            </SelectTrigger>
            <SelectContent>
              {jobProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="job_level">Karrierestufe</Label>
          <Select
            value={formData.job_level || ''}
            onValueChange={(value: EmployeeFormData['job_level']) => 
              setFormData({ ...formData, job_level: value || undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="junior">Junior</SelectItem>
              <SelectItem value="mid">Mid-Level</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="principal">Principal</SelectItem>
              <SelectItem value="director">Director</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="department">Abteilung</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="IT, HR, Vertrieb..."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Standort</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Berlin, München..."
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mitarbeiter</h2>
          <p className="text-muted-foreground">Verwalten Sie die Mitarbeiterdaten Ihres Unternehmens</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Mitarbeiter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
              <DialogDescription>
                Erfassen Sie die Stammdaten des Mitarbeiters.
              </DialogDescription>
            </DialogHeader>
            <FormFields />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                variant="hero" 
                onClick={handleCreate} 
                disabled={!formData.first_name || !formData.last_name}
              >
                Erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Keine Mitarbeiter vorhanden</h3>
          <p className="text-muted-foreground text-center mb-4">
            Legen Sie Ihren ersten Mitarbeiter an, um Gehaltsdaten erfassen zu können.
          </p>
          <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ersten Mitarbeiter anlegen
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Personalnr.</TableHead>
                <TableHead>Abteilung</TableHead>
                <TableHead>Job-Profil</TableHead>
                <TableHead>Stufe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell>{employee.employee_number || '—'}</TableCell>
                  <TableCell>{employee.department || '—'}</TableCell>
                  <TableCell>{getProfileTitle(employee.job_profile_id)}</TableCell>
                  <TableCell>
                    {employee.job_level ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {jobLevelLabels[employee.job_level]}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {employee.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-status-ok/10 text-status-ok">
                        <CheckCircle className="w-3 h-3" />
                        Aktiv
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        <XCircle className="w-3 h-3" />
                        Inaktiv
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsDeleteOpen(true);
                        }}
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
            <DialogDescription>
              Aktualisieren Sie die Mitarbeiterdaten.
            </DialogDescription>
          </DialogHeader>
          <FormFields />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="hero" 
              onClick={handleUpdate} 
              disabled={!formData.first_name || !formData.last_name}
            >
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mitarbeiter löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie {selectedEmployee?.first_name} {selectedEmployee?.last_name} löschen möchten? 
              Alle zugehörigen Gehaltsdaten werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
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

export default EmployeesView;
