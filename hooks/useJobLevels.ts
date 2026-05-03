import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface JobLevel {
  id: string;
  organization_id: string;
  name: string;
  rank: number;
}

export interface JobLevelFormData {
  name: string;
  rank: number;
}

export function useJobLevels() {
  const [jobLevels, setJobLevels] = useState<JobLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, orgId, isLoaded } = useAuth();

  const fetchJobLevels = async () => {
    if (!isLoaded || !user || !orgId) {
      setJobLevels([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/job-levels');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as JobLevel[];
      setJobLevels(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error fetching job levels:', error);
      toast.error(`Fehler beim Laden der Karrierestufen: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const createJobLevel = async (formData: JobLevelFormData): Promise<JobLevel | null> => {
    if (!user || !orgId) {
      toast.error('Keine Organisation zugeordnet');
      return null;
    }

    try {
      const res = await fetch('/api/job-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as JobLevel;
      toast.success('Karrierestufe erfolgreich erstellt');
      await fetchJobLevels();
      return data;
    } catch (error: unknown) {
      console.error('Error creating job level:', error);
      toast.error('Fehler beim Erstellen der Karrierestufe');
      return null;
    }
  };

  const updateJobLevel = async (id: string, formData: Partial<JobLevelFormData>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/job-levels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Karrierestufe erfolgreich aktualisiert');
      await fetchJobLevels();
      return true;
    } catch (error: unknown) {
      console.error('Error updating job level:', error);
      toast.error('Fehler beim Aktualisieren der Karrierestufe');
      return false;
    }
  };

  const deleteJobLevel = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/job-levels/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Karrierestufe erfolgreich gelöscht');
      await fetchJobLevels();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting job level:', error);
      toast.error('Fehler beim Löschen der Karrierestufe');
      return false;
    }
  };

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchJobLevels();
    }
  }, [isLoaded, user, orgId]);

  return {
    jobLevels,
    loading,
    fetchJobLevels,
    createJobLevel,
    updateJobLevel,
    deleteJobLevel,
  };
}
