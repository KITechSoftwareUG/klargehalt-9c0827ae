import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type EvaluationMethod = 'hay' | 'korn_ferry' | 'mercer' | 'willis_towers_watson' | 'internal' | 'other';

export interface JobProfile {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  skills_score: number | null;
  effort_score: number | null;
  responsibility_score: number | null;
  working_conditions_score: number | null;
  evaluation_method: EvaluationMethod | null;
  evaluation_method_notes: string | null;
  evaluated_by: string | null;
  evaluated_by_name: string | null;
  last_evaluated_at: string | null;
  composite_score: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayBand {
  id: string;
  organization_id: string;
  job_profile_id: string;
  job_level_id: string;
  min_salary: number;
  max_salary: number;
  currency: string;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobProfileFormData {
  title: string;
  description?: string;
  department_id?: string | null;
  skills_score?: number | null;
  effort_score?: number | null;
  responsibility_score?: number | null;
  working_conditions_score?: number | null;
  evaluation_method?: EvaluationMethod | null;
  evaluation_method_notes?: string | null;
  evaluated_by?: string | null;
  evaluated_by_name?: string | null;
  last_evaluated_at?: string | null;
  is_active: boolean;
}

export interface PayBandFormData {
  job_profile_id: string;
  job_level_id: string;
  min_salary: number;
  max_salary: number;
  currency: string;
  is_active?: boolean;
  effective_from: string;
  effective_to?: string | null;
}

export function useJobProfiles() {
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, orgId, isLoaded } = useAuth();

  const fetchJobProfiles = async () => {
    if (!isLoaded || !user || !orgId) {
      setJobProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/job-profiles');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as JobProfile[];
      setJobProfiles(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error fetching job profiles:', error);
      toast.error(`Fehler beim Laden der Job-Profile: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const createJobProfile = async (formData: JobProfileFormData): Promise<JobProfile | null> => {
    if (!user || !orgId) {
      toast.error('Keine Organisation zugeordnet');
      return null;
    }

    try {
      const res = await fetch('/api/job-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as JobProfile;
      toast.success('Job-Profil erfolgreich erstellt');
      await fetchJobProfiles();
      return data;
    } catch (error: unknown) {
      console.error('Error creating job profile:', error);
      toast.error('Fehler beim Erstellen des Job-Profils');
      return null;
    }
  };

  const updateJobProfile = async (id: string, formData: Partial<JobProfileFormData>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/job-profiles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Job-Profil erfolgreich aktualisiert');
      await fetchJobProfiles();
      return true;
    } catch (error: unknown) {
      console.error('Error updating job profile:', error);
      toast.error('Fehler beim Aktualisieren des Job-Profils');
      return false;
    }
  };

  const deleteJobProfile = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/job-profiles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Job-Profil erfolgreich gelöscht');
      await fetchJobProfiles();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting job profile:', error);
      toast.error('Fehler beim Löschen des Job-Profils');
      return false;
    }
  };

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchJobProfiles();
    }
  }, [isLoaded, user, orgId]);

  return {
    jobProfiles,
    loading,
    fetchJobProfiles,
    createJobProfile,
    updateJobProfile,
    deleteJobProfile,
  };
}

export function usePayBands(jobProfileId?: string) {
  const [payBands, setPayBands] = useState<PayBand[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, orgId, isLoaded } = useAuth();

  const fetchPayBands = async () => {
    if (!isLoaded || !user || !orgId) return;

    setLoading(true);
    const url = jobProfileId
      ? `/api/pay-bands?job_profile_id=${jobProfileId}`
      : '/api/pay-bands';

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as PayBand[];
      setPayBands(data);
    } catch (error: unknown) {
      console.error('Error fetching pay bands:', error);
      toast.error('Fehler beim Laden der Gehaltsbänder');
    } finally {
      setLoading(false);
    }
  };

  const createPayBand = async (formData: PayBandFormData): Promise<PayBand | null> => {
    if (!user || !orgId) {
      toast.error('Keine Organisation zugeordnet');
      return null;
    }

    try {
      const res = await fetch('/api/pay-bands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as PayBand;
      toast.success('Gehaltsband erfolgreich erstellt');
      await fetchPayBands();
      return data;
    } catch (error: unknown) {
      console.error('Error creating pay band:', error);
      toast.error('Fehler beim Erstellen des Gehaltsbands');
      return null;
    }
  };

  const updatePayBand = async (id: string, formData: Partial<PayBandFormData>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/pay-bands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Gehaltsband erfolgreich aktualisiert');
      await fetchPayBands();
      return true;
    } catch (error: unknown) {
      console.error('Error updating pay band:', error);
      toast.error('Fehler beim Aktualisieren des Gehaltsbands');
      return false;
    }
  };

  const deletePayBand = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/pay-bands/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Gehaltsband erfolgreich gelöscht');
      await fetchPayBands();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting pay band:', error);
      toast.error('Fehler beim Löschen des Gehaltsbands');
      return false;
    }
  };

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchPayBands();
    }
  }, [isLoaded, user, jobProfileId, orgId]);

  return {
    payBands,
    loading,
    fetchPayBands,
    createPayBand,
    updatePayBand,
    deletePayBand,
  };
}
