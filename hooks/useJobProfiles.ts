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
  const { user, orgId, isLoaded, supabase } = useAuth();

  const fetchJobProfiles = async () => {
    if (!isLoaded || !user) {
      setJobProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase.from('job_profiles').select('*');

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query.order('title');

      if (error) throw error;
      setJobProfiles(data || []);
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
      const { data, error } = await supabase
        .from('job_profiles')
        .insert({
          ...formData,
          organization_id: orgId,
        })
        .select()
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from('job_profiles')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('job_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
  const { user, orgId, isLoaded, supabase } = useAuth();

  const fetchPayBands = async () => {
    if (!isLoaded || !user) return;

    setLoading(true);
    let query = supabase.from('pay_bands').select('*');

    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    if (jobProfileId) {
      query = query.eq('job_profile_id', jobProfileId);
    }

    const { data, error } = await query.order('created_at');

    if (error) {
      console.error('Error fetching pay bands:', error);
      toast.error('Fehler beim Laden der Gehaltsbänder');
    } else {
      setPayBands(data || []);
    }
    setLoading(false);
  };

  const createPayBand = async (formData: PayBandFormData): Promise<PayBand | null> => {
    if (!user || !orgId) {
      toast.error('Keine Organisation zugeordnet');
      return null;
    }

    const { data, error } = await supabase
      .from('pay_bands')
      .insert({
        ...formData,
        organization_id: orgId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pay band:', error);
      toast.error('Fehler beim Erstellen des Gehaltsbands');
      return null;
    }

    toast.success('Gehaltsband erfolgreich erstellt');
    await fetchPayBands();
    return data;
  };

  const updatePayBand = async (id: string, formData: Partial<PayBandFormData>): Promise<boolean> => {
    const { error } = await supabase
      .from('pay_bands')
      .update(formData)
      .eq('id', id);

    if (error) {
      console.error('Error updating pay band:', error);
      toast.error('Fehler beim Aktualisieren des Gehaltsbands');
      return false;
    }

    toast.success('Gehaltsband erfolgreich aktualisiert');
    await fetchPayBands();
    return true;
  };

  const deletePayBand = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('pay_bands')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pay band:', error);
      toast.error('Fehler beim Löschen des Gehaltsbands');
      return false;
    }

    toast.success('Gehaltsband erfolgreich gelöscht');
    await fetchPayBands();
    return true;
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchPayBands();
    }
  }, [isLoaded, user, jobProfileId]);

  return {
    payBands,
    loading,
    fetchPayBands,
    createPayBand,
    updatePayBand,
    deletePayBand,
  };
}
