import { useState, useEffect } from 'react';
import { createClientWithToken } from '@/utils/supabase/client';
import { useSession } from '@clerk/nextjs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface JobProfile {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  responsibilities: string | null;
  required_qualifications: string | null;
  min_experience_years: number;
  department: string | null;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PayBand {
  id: string;
  job_profile_id: string;
  job_level: 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'director';
  min_salary: number;
  max_salary: number;
  median_salary: number | null;
  currency: string;
  valid_from: string;
  valid_until: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JobProfileFormData {
  title: string;
  description?: string;
  responsibilities?: string;
  required_qualifications?: string;
  min_experience_years: number;
  department?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern';
  is_active: boolean;
}

export interface PayBandFormData {
  job_profile_id: string;
  job_level: 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'director';
  min_salary: number;
  max_salary: number;
  median_salary?: number;
  currency: string;
  valid_from: string;
  valid_until?: string;
}

export function useJobProfiles() {
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, orgId, isLoaded } = useAuth();
  const { session } = useSession();

  const getSupabase = async () => {
    const token = await session?.getToken({ template: 'supabase' });
    return createClientWithToken(token || null);
  };

  const fetchJobProfiles = async () => {
    if (!isLoaded || !user) {
      setJobProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = await getSupabase();
      let query = supabase.from('job_profiles').select('*');

      if (orgId) {
        query = query.eq('organization_id', orgId);
      } else {
        // Fallback: Suche nach Profilen ohne Org (Demo-Daten) oder dem User zugeordnet
        query = query.or(`organization_id.is.null,created_by.eq.${user.id}`);
      }

      const { data, error } = await query.order('title');

      if (error) throw error;
      setJobProfiles(data || []);
    } catch (error: any) {
      console.error('Detailed error fetching job profiles:', error);
      toast.error(`Fehler beim Laden der Job-Profile: ${error.message || 'Unbekannter Fehler'}`);
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
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('job_profiles')
        .insert({
          ...formData,
          organization_id: orgId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Job-Profil erfolgreich erstellt');
      await fetchJobProfiles();
      return data;
    } catch (error: any) {
      console.error('Error creating job profile:', error);
      toast.error('Fehler beim Erstellen des Job-Profils');
      return null;
    }
  };

  const updateJobProfile = async (id: string, formData: Partial<JobProfileFormData>): Promise<boolean> => {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('job_profiles')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Job-Profil erfolgreich aktualisiert');
      await fetchJobProfiles();
      return true;
    } catch (error: any) {
      console.error('Error updating job profile:', error);
      toast.error('Fehler beim Aktualisieren des Job-Profils');
      return false;
    }
  };

  const deleteJobProfile = async (id: string): Promise<boolean> => {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('job_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Job-Profil erfolgreich gelöscht');
      await fetchJobProfiles();
      return true;
    } catch (error: any) {
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
  const { session } = useSession();

  const getSupabase = async () => {
    const token = await session?.getToken({ template: 'supabase' });
    return createClientWithToken(token || null);
  };

  const fetchPayBands = async () => {
    if (!isLoaded || !user) return;

    setLoading(true);
    const supabase = await getSupabase();
    let query = supabase.from('pay_bands').select('*');

    if (jobProfileId) {
      query = query.eq('job_profile_id', jobProfileId);
    }

    const { data, error } = await query.order('job_level');

    if (error) {
      console.error('Error fetching pay bands:', error);
      toast.error('Fehler beim Laden der Gehaltsbänder');
    } else {
      setPayBands(data || []);
    }
    setLoading(false);
  };

  const createPayBand = async (formData: PayBandFormData): Promise<PayBand | null> => {
    if (!user) return null;

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('pay_bands')
      .insert({
        ...formData,
        created_by: user.id,
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
    const supabase = await getSupabase();
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
    const supabase = await getSupabase();
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
