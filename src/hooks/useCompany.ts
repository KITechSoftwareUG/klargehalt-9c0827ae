import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Company {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  address: string | null;
  country: string;
  industry: string | null;
  employee_count_range: string | null;
  is_active: boolean;
  settings: unknown;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormData {
  name: string;
  legal_name?: string;
  tax_id?: string;
  address?: string;
  country?: string;
  industry?: string;
  employee_count_range?: '1-50' | '51-100' | '101-250' | '251-500' | '501-1000' | '1000+';
}

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getCompanyId = async (): Promise<string | null> => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    return data?.company_id || null;
  };

  const fetchCompany = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const companyId = await getCompanyId();
    
    if (!companyId) {
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching company:', error);
    } else {
      setCompany(data as Company | null);
    }
    setLoading(false);
  };

  const createCompany = async (formData: CompanyFormData): Promise<Company | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('companies')
      .insert(formData)
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      toast.error('Fehler beim Erstellen der Firma');
      return null;
    }

    // Link company to user profile
    await supabase
      .from('profiles')
      .update({ company_id: data.id })
      .eq('user_id', user.id);

    toast.success('Firma erfolgreich erstellt');
    const companyData = data as Company;
    setCompany(companyData);
    return companyData;
  };

  const updateCompany = async (formData: Partial<CompanyFormData>): Promise<boolean> => {
    if (!company) return false;

    const { error } = await supabase
      .from('companies')
      .update(formData)
      .eq('id', company.id);

    if (error) {
      console.error('Error updating company:', error);
      toast.error('Fehler beim Aktualisieren der Firma');
      return false;
    }

    toast.success('Firma erfolgreich aktualisiert');
    await fetchCompany();
    return true;
  };

  useEffect(() => {
    fetchCompany();
  }, [user]);

  return {
    company,
    loading,
    fetchCompany,
    createCompany,
    updateCompany,
  };
}
