'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
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
  size: string | null;
  created_by: string | null;
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
  size?: string;
}

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getCompanyId = async (): Promise<string | null> => {
    if (!user) return null;

    const supabase = createClient();
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

    const supabase = createClient();
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
    if (!user) {
      toast.error('Sie müssen angemeldet sein');
      return null;
    }

    const supabase = createClient();

    // Add created_by field
    const companyData = {
      ...formData,
      created_by: user.id,
      country: formData.country || 'DE',
    };

    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      toast.error(`Fehler beim Erstellen der Firma: ${error.message}`);
      return null;
    }

    // Link company to user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ company_id: data.id, company_name: formData.name })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error linking company to profile:', profileError);
    }

    toast.success('Firma erfolgreich erstellt');
    const newCompany = data as Company;
    setCompany(newCompany);
    return newCompany;
  };

  const updateCompany = async (formData: Partial<CompanyFormData>): Promise<boolean> => {
    if (!company) {
      toast.error('Keine Firma gefunden');
      return false;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('companies')
      .update(formData)
      .eq('id', company.id);

    if (error) {
      console.error('Error updating company:', error);
      toast.error(`Fehler beim Aktualisieren der Firma: ${error.message}`);
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
