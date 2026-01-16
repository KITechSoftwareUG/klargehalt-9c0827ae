import { useState } from 'react';
import { useJobProfiles, JobProfile, JobProfileFormData } from '@/hooks/useJobProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Briefcase, CheckCircle, XCircle } from 'lucide-react';

const employmentTypeLabels: Record<string, string> = {
  full_time: 'Vollzeit',
  part_time: 'Teilzeit',
  contract: 'Vertrag',
  intern: 'Praktikum',
};

const JobProfilesView = () => {
  const { jobProfiles, loading, createJobProfile, updateJobProfile, deleteJobProfile } = useJobProfiles();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(null);
  const [formData, setFormData] = useState<JobProfileFormData>({
    title: '',
    description: '',
    responsibilities: '',
    required_qualifications: '',
    min_experience_years: 0,
    department: '',
    employment_type: 'full_time',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      responsibilities: '',
      required_qualifications: '',
      min_experience_years: 0,
      department: '',
      employment_type: 'full_time',
      is_active: true,
    });
  };

  const handleCreate = async () => {
    await createJobProfile(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (profile: JobProfile) => {
    setSelectedProfile(profile);
    setFormData({
      title: profile.title,
      description: profile.description || '',
      responsibilities: profile.responsibilities || '',
      required_qualifications: profile.required_qualifications || '',
      min_experience_years: profile.min_experience_years,
      department: profile.department || '',
      employment_type: profile.employment_type,
      is_active: profile.is_active,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedProfile) return;
    await updateJobProfile(selectedProfile.id, formData);
    setIsEditOpen(false);
    setSelectedProfile(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;
    await deleteJobProfile(selectedProfile.id);
    setIsDeleteOpen(false);
    setSelectedProfile(null);
  };

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Titel *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="z.B. Software Engineer"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="department">Abteilung</Label>
        <Input
          id="department"
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          placeholder="z.B. IT, HR, Vertrieb"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Kurze Beschreibung der Position"
          rows={2}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="responsibilities">Verantwortlichkeiten</Label>
        <Textarea
          id="responsibilities"
          value={formData.responsibilities}
          onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
          placeholder="Hauptverantwortlichkeiten der Position"
          rows={2}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="qualifications">Erforderliche Qualifikationen</Label>
        <Textarea
          id="qualifications"
          value={formData.required_qualifications}
          onChange={(e) => setFormData({ ...formData, required_qualifications: e.target.value })}
          placeholder="Benötigte Qualifikationen und Fähigkeiten"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="experience">Min. Erfahrung (Jahre)</Label>
          <Input
            id="experience"
            type="number"
            min={0}
            value={formData.min_experience_years}
            onChange={(e) => setFormData({ ...formData, min_experience_years: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="employment_type">Beschäftigungsart</Label>
          <Select
            value={formData.employment_type}
            onValueChange={(value: 'full_time' | 'part_time' | 'contract' | 'intern') => 
              setFormData({ ...formData, employment_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Vollzeit</SelectItem>
              <SelectItem value="part_time">Teilzeit</SelectItem>
              <SelectItem value="contract">Vertrag</SelectItem>
              <SelectItem value="intern">Praktikum</SelectItem>
            </SelectContent>
          </Select>
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
          <h2 className="text-2xl font-bold text-foreground">Job-Profile</h2>
          <p className="text-muted-foreground">Verwalten Sie die Stellenprofile Ihres Unternehmens</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Neues Profil
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neues Job-Profil erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues Stellenprofil für Ihre Entgeltstruktur.
              </DialogDescription>
            </DialogHeader>
            <FormFields />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Abbrechen
              </Button>
              <Button variant="hero" onClick={handleCreate} disabled={!formData.title}>
                Erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {jobProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Keine Job-Profile vorhanden</h3>
          <p className="text-muted-foreground text-center mb-4">
            Erstellen Sie Ihr erstes Job-Profil, um Gehaltsbänder definieren zu können.
          </p>
          <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Erstes Profil erstellen
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Abteilung</TableHead>
                <TableHead>Beschäftigungsart</TableHead>
                <TableHead>Min. Erfahrung</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.title}</TableCell>
                  <TableCell>{profile.department || '—'}</TableCell>
                  <TableCell>{employmentTypeLabels[profile.employment_type]}</TableCell>
                  <TableCell>{profile.min_experience_years} Jahre</TableCell>
                  <TableCell>
                    {profile.is_active ? (
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
                        onClick={() => handleEdit(profile)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProfile(profile);
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
            <DialogTitle>Job-Profil bearbeiten</DialogTitle>
            <DialogDescription>
              Aktualisieren Sie die Details des Stellenprofils.
            </DialogDescription>
          </DialogHeader>
          <FormFields />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="hero" onClick={handleUpdate} disabled={!formData.title}>
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Job-Profil löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie das Profil "{selectedProfile?.title}" löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Gehaltsbänder werden ebenfalls gelöscht.
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

export default JobProfilesView;
