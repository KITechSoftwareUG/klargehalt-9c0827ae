import { useState } from 'react';
import { useEmployees, Employee, EmployeeFormData } from '@/hooks/useEmployees';
import { useJobProfiles } from '@/hooks/useJobProfiles';
import { useDepartments } from '@/hooks/useDepartments';
import { useJobLevels } from '@/hooks/useJobLevels';
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
import { Plus, Pencil, Trash2, Users, CheckCircle, XCircle, Euro } from 'lucide-react';

const genderLabels: Record<string, string> = {
  male: 'Männlich',
  female: 'Weiblich',
  diverse: 'Divers',
  not_specified: 'Keine Angabe',
};

const employmentTypeLabels: Record<string, string> = {
  full_time: 'Vollzeit',
  part_time: 'Teilzeit',
  contract: 'Vertrag',
};

const formatCurrency = (value: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const defaultFormData: EmployeeFormData = {
  first_name: '',
  last_name: '',
  email: '',
  employee_number: '',
  gender: 'not_specified',
  hire_date: new Date().toISOString().split('T')[0],
  employment_type: 'full_time',
  base_salary: 0,
  variable_pay: 0,
  weekly_hours: 40,
  currency: 'EUR',
  job_profile_id: '',
  job_level_id: '',
  department_id: '',
  location: '',
  is_active: true,
};

const EmployeesView = () => {
  const { employees, loading, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { jobProfiles } = useJobProfiles();
  const { departments } = useDepartments();
  const { jobLevels } = useJobLevels();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({ ...defaultFormData });

  const resetForm = () => {
    setFormData({ ...defaultFormData });
  };

  const handleCreate = async () => {
    const submitData = { ...formData };
    if (!submitData.job_profile_id) delete submitData.job_profile_id;
    if (!submitData.job_level_id) delete submitData.job_level_id;
    if (!submitData.department_id) delete submitData.department_id;
    await createEmployee(submitData);
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
      gender: employee.gender,
      hire_date: employee.hire_date,
      employment_type: employee.employment_type,
      base_salary: employee.base_salary,
      variable_pay: employee.variable_pay || 0,
      weekly_hours: employee.weekly_hours || 40,
      currency: employee.currency || 'EUR',
      job_profile_id: employee.job_profile_id || '',
      job_level_id: employee.job_level_id || '',
      department_id: employee.department_id || '',
      location: employee.location || '',
      is_active: employee.is_active,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;
    const submitData = { ...formData };
    if (!submitData.job_profile_id) delete submitData.job_profile_id;
    if (!submitData.job_level_id) delete submitData.job_level_id;
    if (!submitData.department_id) delete submitData.department_id;
    await updateEmployee(selectedEmployee.id, submitData);
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
    return jobProfiles.find(p => p.id === profileId)?.title || '—';
  };

  const getDeptName = (deptId: string | null) => {
    if (!deptId) return '—';
    return departments.find(d => d.id === deptId)?.name || '—';
  };

  const getLevelName = (levelId: string | null) => {
    if (!levelId) return null;
    return jobLevels.find(l => l.id === levelId)?.name || null;
  };

  const canSubmit = formData.first_name && formData.last_name && formData.gender && formData.hire_date && formData.employment_type && formData.base_salary > 0;

  const FormFields = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Name */}
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

      {/* Email + Personalnr */}
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

      {/* Gender + Employment Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Geschlecht *</Label>
          <Select
            value={formData.gender}
            onValueChange={(value: EmployeeFormData['gender']) =>
              setFormData({ ...formData, gender: value })
            }
          >
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Männlich</SelectItem>
              <SelectItem value="female">Weiblich</SelectItem>
              <SelectItem value="diverse">Divers</SelectItem>
              <SelectItem value="not_specified">Keine Angabe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Beschäftigungsart *</Label>
          <Select
            value={formData.employment_type}
            onValueChange={(value: EmployeeFormData['employment_type']) =>
              setFormData({ ...formData, employment_type: value })
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Vollzeit</SelectItem>
              <SelectItem value="part_time">Teilzeit</SelectItem>
              <SelectItem value="contract">Vertrag</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hire date + Location */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="hire_date">Eintrittsdatum *</Label>
          <Input
            id="hire_date"
            type="date"
            value={formData.hire_date}
            onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
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

      {/* Department + Job Profile */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Abteilung</Label>
          <Select
            value={formData.department_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, department_id: value === 'none' ? '' : value })}
          >
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Keine —</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Job-Profil</Label>
          <Select
            value={formData.job_profile_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, job_profile_id: value === 'none' ? '' : value })}
          >
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Keines —</SelectItem>
              {jobProfiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>{profile.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Level + Weekly Hours */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Karrierestufe</Label>
          <Select
            value={formData.job_level_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, job_level_id: value === 'none' ? '' : value })}
          >
            <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Keine —</SelectItem>
              {jobLevels.map((level) => (
                <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="weekly_hours">Wochenstunden</Label>
          <Input
            id="weekly_hours"
            type="number"
            min={0}
            max={60}
            step={0.5}
            value={formData.weekly_hours ?? 40}
            onChange={(e) => setFormData({ ...formData, weekly_hours: parseFloat(e.target.value) || 40 })}
          />
        </div>
      </div>

      {/* Salary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="base_salary">Grundgehalt (jährlich) *</Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="base_salary"
              type="number"
              min={0}
              className="pl-10"
              value={formData.base_salary || ''}
              onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
              placeholder="50.000"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="variable_pay">Variable Vergütung (jährlich)</Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="variable_pay"
              type="number"
              min={0}
              className="pl-10"
              value={formData.variable_pay || ''}
              onChange={(e) => setFormData({ ...formData, variable_pay: parseFloat(e.target.value) || 0 })}
              placeholder="5.000"
            />
          </div>
        </div>
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
              <DialogDescription>Erfassen Sie die Stamm- und Gehaltsdaten des Mitarbeiters.</DialogDescription>
            </DialogHeader>
            <FormFields />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Abbrechen</Button>
              <Button variant="hero" onClick={handleCreate} disabled={!canSubmit}>Erstellen</Button>
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
                <TableHead>Grundgehalt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.first_name} {employee.last_name}
                    <div className="text-xs text-muted-foreground">
                      {genderLabels[employee.gender]} · {employmentTypeLabels[employee.employment_type]}
                    </div>
                  </TableCell>
                  <TableCell>{employee.employee_number || '—'}</TableCell>
                  <TableCell>{getDeptName(employee.department_id)}</TableCell>
                  <TableCell>{getProfileTitle(employee.job_profile_id)}</TableCell>
                  <TableCell>
                    {getLevelName(employee.job_level_id) ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {getLevelName(employee.job_level_id)}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCurrency(employee.base_salary, employee.currency)}
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
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedEmployee(employee); setIsDeleteOpen(true); }}
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
            <DialogDescription>Aktualisieren Sie die Mitarbeiterdaten.</DialogDescription>
          </DialogHeader>
          <FormFields />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Abbrechen</Button>
            <Button variant="hero" onClick={handleUpdate} disabled={!canSubmit}>Speichern</Button>
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
