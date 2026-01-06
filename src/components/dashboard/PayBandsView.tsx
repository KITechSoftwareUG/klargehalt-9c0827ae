import { useState, useEffect } from 'react';
import { useJobProfiles, usePayBands, PayBand, PayBandFormData } from '@/hooks/useJobProfiles';
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
import { Plus, Pencil, Trash2, Scale, Euro } from 'lucide-react';

const jobLevelLabels: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mid-Level',
  senior: 'Senior',
  lead: 'Lead',
  principal: 'Principal',
  director: 'Director',
};

const formatCurrency = (value: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const PayBandsView = () => {
  const { jobProfiles, loading: profilesLoading } = useJobProfiles();
  const { payBands, loading: bandsLoading, createPayBand, updatePayBand, deletePayBand } = usePayBands();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBand, setSelectedBand] = useState<PayBand | null>(null);
  const [formData, setFormData] = useState<PayBandFormData>({
    job_profile_id: '',
    job_level: 'junior',
    min_salary: 0,
    max_salary: 0,
    median_salary: undefined,
    currency: 'EUR',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: undefined,
  });

  const resetForm = () => {
    setFormData({
      job_profile_id: '',
      job_level: 'junior',
      min_salary: 0,
      max_salary: 0,
      median_salary: undefined,
      currency: 'EUR',
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: undefined,
    });
  };

  const handleCreate = async () => {
    await createPayBand(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = (band: PayBand) => {
    setSelectedBand(band);
    setFormData({
      job_profile_id: band.job_profile_id,
      job_level: band.job_level,
      min_salary: band.min_salary,
      max_salary: band.max_salary,
      median_salary: band.median_salary || undefined,
      currency: band.currency,
      valid_from: band.valid_from,
      valid_until: band.valid_until || undefined,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedBand) return;
    await updatePayBand(selectedBand.id, formData);
    setIsEditOpen(false);
    setSelectedBand(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedBand) return;
    await deletePayBand(selectedBand.id);
    setIsDeleteOpen(false);
    setSelectedBand(null);
  };

  // Auto-calculate median
  useEffect(() => {
    if (formData.min_salary > 0 && formData.max_salary > 0) {
      const median = Math.round((formData.min_salary + formData.max_salary) / 2);
      setFormData(prev => ({ ...prev, median_salary: median }));
    }
  }, [formData.min_salary, formData.max_salary]);

  const getProfileTitle = (profileId: string) => {
    const profile = jobProfiles.find(p => p.id === profileId);
    return profile?.title || 'Unbekannt';
  };

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="job_profile">Job-Profil *</Label>
        <Select
          value={formData.job_profile_id}
          onValueChange={(value) => setFormData({ ...formData, job_profile_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wählen Sie ein Job-Profil" />
          </SelectTrigger>
          <SelectContent>
            {jobProfiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.title} {profile.department && `(${profile.department})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="job_level">Karrierestufe *</Label>
        <Select
          value={formData.job_level}
          onValueChange={(value: PayBandFormData['job_level']) => 
            setFormData({ ...formData, job_level: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
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

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="min_salary">Mindestgehalt *</Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="min_salary"
              type="number"
              min={0}
              className="pl-10"
              value={formData.min_salary || ''}
              onChange={(e) => setFormData({ ...formData, min_salary: parseInt(e.target.value) || 0 })}
              placeholder="40.000"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="max_salary">Maximalgehalt *</Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="max_salary"
              type="number"
              min={0}
              className="pl-10"
              value={formData.max_salary || ''}
              onChange={(e) => setFormData({ ...formData, max_salary: parseInt(e.target.value) || 0 })}
              placeholder="60.000"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="median_salary">Median (berechnet)</Label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="median_salary"
              type="number"
              min={0}
              className="pl-10 bg-muted"
              value={formData.median_salary || ''}
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="valid_from">Gültig ab *</Label>
          <Input
            id="valid_from"
            type="date"
            value={formData.valid_from}
            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="valid_until">Gültig bis (optional)</Label>
          <Input
            id="valid_until"
            type="date"
            value={formData.valid_until || ''}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value || undefined })}
          />
        </div>
      </div>
    </div>
  );

  const loading = profilesLoading || bandsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (jobProfiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
        <Scale className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Keine Job-Profile vorhanden</h3>
        <p className="text-muted-foreground text-center mb-4">
          Erstellen Sie zuerst Job-Profile, bevor Sie Gehaltsbänder definieren können.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gehaltsbänder</h2>
          <p className="text-muted-foreground">Definieren Sie Gehaltsspannen für Ihre Job-Profile</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Neues Gehaltsband
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neues Gehaltsband erstellen</DialogTitle>
              <DialogDescription>
                Definieren Sie eine Gehaltsspanne für ein Job-Profil und Karrierestufe.
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
                disabled={!formData.job_profile_id || formData.min_salary <= 0 || formData.max_salary <= 0}
              >
                Erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {payBands.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
          <Scale className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Keine Gehaltsbänder vorhanden</h3>
          <p className="text-muted-foreground text-center mb-4">
            Definieren Sie Ihr erstes Gehaltsband für die EU-Entgelttransparenz.
          </p>
          <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Erstes Gehaltsband erstellen
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job-Profil</TableHead>
                <TableHead>Karrierestufe</TableHead>
                <TableHead>Gehaltsspanne</TableHead>
                <TableHead>Median</TableHead>
                <TableHead>Gültig ab</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payBands.map((band) => (
                <TableRow key={band.id}>
                  <TableCell className="font-medium">{getProfileTitle(band.job_profile_id)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {jobLevelLabels[band.job_level]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(band.min_salary, band.currency)} – {formatCurrency(band.max_salary, band.currency)}
                  </TableCell>
                  <TableCell>
                    {band.median_salary ? formatCurrency(band.median_salary, band.currency) : '—'}
                  </TableCell>
                  <TableCell>
                    {new Date(band.valid_from).toLocaleDateString('de-DE')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(band)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBand(band);
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
            <DialogTitle>Gehaltsband bearbeiten</DialogTitle>
            <DialogDescription>
              Aktualisieren Sie die Details des Gehaltsbands.
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
              disabled={!formData.job_profile_id || formData.min_salary <= 0 || formData.max_salary <= 0}
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
            <AlertDialogTitle>Gehaltsband löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie dieses Gehaltsband löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
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

export default PayBandsView;
