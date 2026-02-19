'use client';

import { useState, useEffect } from 'react';
import { createClientWithToken } from '@/utils/supabase/client';
import { useAuth } from './useAuth';
import { useSession } from '@clerk/nextjs';
import { toast } from 'sonner';

export interface Company {
  id: string;
  organization_id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  address: string | null;
  country: string;
  industry: string | null;
  employee_count_range: string | null;
  size: string | null;
  created_by: string | null;
  is_active: boolean;
  settings: unknown;
  created_at: string;
  updated_at: string;
  subscription_tier: 'basis' | 'manager' | 'excellence';
  trial_ends_at: string | null;
}

export interface CompanyFormData {
  name: string;
  legal_name?: string;
  tax_id?: string;
  address?: string;
  country?: string;
  industry?: string;
  employee_count_range?: '1-50' | '51-100' | '101-250' | '251-500' | '501-1000' | '1000+';
  size?: string;
}

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, orgId, isLoaded } = useAuth();
  const { session } = useSession();

  const getSupabase = async () => {
    const token = await session?.getToken({ template: 'supabase' });
    return createClientWithToken(token || null);
  };

  const fetchCompany = async () => {
    if (!isLoaded || !user) {
      setCompany(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = await getSupabase();
      let query = supabase.from('companies').select('*');

      if (orgId) {
        query = query.eq('organization_id', orgId);
      } else {
        // Fallback: Demo-Firma (ohne Org-ID)
        query = query.is('organization_id', null).limit(1);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      setCompany(data as Company | null);
    } catch (error: any) {
      console.error('Detailed error fetching company:', error);
      toast.error(`Fehler beim Laden der Firmendaten: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (formData: CompanyFormData): Promise<Company | null> => {
    if (!user || !orgId) {
      toast.error('Sie müssen Mitglied einer Organisation sein');
      return null;
    }

    try {
      const supabase = await getSupabase();

      const companyData = {
        ...formData,
        organization_id: orgId,
        created_by: user.id,
        country: formData.country || 'DE',
      };

      const { data, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (error) throw error;

      // Optional: Sync back to profile
      await supabase
        .from('profiles')
        .update({ company_name: formData.name })
        .eq('user_id', user.id);

      toast.success('Firma erfolgreich erstellt');
      setCompany(data as Company);
      return data as Company;
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast.error(`Fehler beim Erstellen der Firma: ${error.message}`);
      return null;
    }
  };

  const updateCompany = async (formData: Partial<CompanyFormData>): Promise<boolean> => {
    if (!company) {
      toast.error('Keine Firma zum Aktualisieren gefunden');
      return false;
    }

    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('companies')
        .update(formData)
        .eq('id', company.id);

      if (error) throw error;

      toast.success('Firma erfolgreich aktualisiert');
      await fetchCompany();
      return true;
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast.error(`Fehler beim Aktualisieren der Firma: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchCompany();
    }
  }, [isLoaded, user, orgId]);

  return {
    company,
    currentCompany: company, // Alias für Konsistenz
    loading,
    isLoading: loading, // Alias für Konsistenz
    fetchCompany,
    createCompany,
    updateCompany,
  };
}
