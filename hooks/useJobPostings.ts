import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface JobPosting {
  id: string;
  organization_id: string;
  title: string;
  job_profile_id: string | null;
  job_level_id: string | null;
  department_id: string | null;
  salary_range_min: number;
  salary_range_max: number;
  currency: string;
  location: string | null;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship' | null;
  description: string | null;
  salary_disclosed: boolean;
  published_at: string | null;
  closed_at: string | null;
  status: 'draft' | 'published' | 'closed';
  export_text: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // joined fields
  job_profile_title?: string | null;
  job_level_name?: string | null;
  department_name?: string | null;
}

export type CreateJobPostingInput = {
  title: string;
  job_profile_id?: string;
  job_level_id?: string;
  department_id?: string;
  salary_range_min: number;
  salary_range_max: number;
  currency?: string;
  location?: string;
  employment_type?: JobPosting['employment_type'];
  description?: string;
};

type RawJobPosting = Omit<JobPosting, 'job_profile_title' | 'job_level_name' | 'department_name'> & {
  job_profiles: { title: string } | null;
  job_levels: { name: string } | null;
  departments: { name: string } | null;
};

function mapRawPosting(raw: RawJobPosting): JobPosting {
  const { job_profiles, job_levels, departments, ...rest } = raw;
  return {
    ...rest,
    job_profile_title: job_profiles?.title ?? null,
    job_level_name: job_levels?.name ?? null,
    department_name: departments?.name ?? null,
  };
}

export function useJobPostings() {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, orgId, isLoaded, supabase } = useAuth();

  const fetchPostings = async () => {
    if (!isLoaded || !user) {
      setPostings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('job_postings')
        .select(`
          *,
          job_profiles ( title ),
          job_levels ( name ),
          departments ( name )
        `);

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setPostings((data as RawJobPosting[]).map(mapRawPosting));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error fetching job postings:', error);
      toast.error(`Fehler beim Laden der Stellenausschreibungen: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const createPosting = async (input: CreateJobPostingInput): Promise<JobPosting | null> => {
    if (!user || !orgId) {
      toast.error('Keine Organisation zugeordnet');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('job_postings')
        .insert({
          title: input.title,
          job_profile_id: input.job_profile_id ?? null,
          job_level_id: input.job_level_id ?? null,
          department_id: input.department_id ?? null,
          salary_range_min: input.salary_range_min,
          salary_range_max: input.salary_range_max,
          currency: input.currency ?? 'EUR',
          location: input.location ?? null,
          employment_type: input.employment_type ?? null,
          description: input.description ?? null,
          organization_id: orgId,
          created_by: user?.id || '',
          status: 'draft',
          salary_disclosed: true,
        })
        .select(`
          *,
          job_profiles ( title ),
          job_levels ( name ),
          departments ( name )
        `)
        .single();

      if (error) throw error;

      const mapped = mapRawPosting(data as RawJobPosting);
      setPostings((prev) => [mapped, ...prev]);
      toast.success('Stellenausschreibung erfolgreich erstellt');
      return mapped;
    } catch (error: unknown) {
      console.error('Error creating job posting:', error);
      toast.error('Fehler beim Erstellen der Stellenausschreibung');
      return null;
    }
  };

  const updatePosting = async (id: string, updates: Partial<CreateJobPostingInput>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Stellenausschreibung erfolgreich aktualisiert');
      await fetchPostings();
      return true;
    } catch (error: unknown) {
      console.error('Error updating job posting:', error);
      toast.error('Fehler beim Aktualisieren der Stellenausschreibung');
      return false;
    }
  };

  const publishPosting = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setPostings((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'published' as const, published_at: new Date().toISOString() }
            : p
        )
      );
      toast.success('Stelle erfolgreich veröffentlicht');
      return true;
    } catch (error: unknown) {
      console.error('Error publishing job posting:', error);
      toast.error('Fehler beim Veröffentlichen der Stelle');
      return false;
    }
  };

  const closePosting = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setPostings((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'closed' as const, closed_at: new Date().toISOString() }
            : p
        )
      );
      toast.success('Stelle erfolgreich geschlossen');
      return true;
    } catch (error: unknown) {
      console.error('Error closing job posting:', error);
      toast.error('Fehler beim Schließen der Stelle');
      return false;
    }
  };

  const deletePosting = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPostings((prev) => prev.filter((p) => p.id !== id));
      toast.success('Stellenausschreibung erfolgreich gelöscht');
      return true;
    } catch (error: unknown) {
      console.error('Error deleting job posting:', error);
      toast.error('Fehler beim Löschen der Stellenausschreibung');
      return false;
    }
  };

  const getSuggestedRange = async (
    jobProfileId: string,
    jobLevelId?: string
  ): Promise<{ min: number; max: number; currency: string } | null> => {
    try {
      let query = supabase
        .from('pay_bands')
        .select('min_salary, max_salary, currency')
        .eq('job_profile_id', jobProfileId)
        .eq('is_active', true);

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      if (jobLevelId) {
        query = query.eq('job_level_id', jobLevelId);
      }

      const { data, error } = await query.limit(1).single();

      if (error || !data) return null;

      return {
        min: data.min_salary as number,
        max: data.max_salary as number,
        currency: data.currency as string,
      };
    } catch (error: unknown) {
      console.error('Error fetching suggested range:', error);
      return null;
    }
  };

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchPostings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, orgId]);

  return {
    postings,
    loading,
    createPosting,
    updatePosting,
    publishPosting,
    closePosting,
    deletePosting,
    getSuggestedRange,
  };
}
