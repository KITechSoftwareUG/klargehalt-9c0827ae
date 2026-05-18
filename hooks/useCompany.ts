'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { friendlyApiError, friendlyError } from '@/lib/api-error';

export interface Company {
  id: string;
  organization_id: string;
  name: string;
  legal_name: string | null;
  country: string;
  industry: string | null;
  employee_size_band: string | null;
  reporting_frequency: string | null;
  logo_url: string | null;
  default_currency: string;
  default_locale: string;
  default_timezone: string;
  address: string | null;
  vat_id: string | null;
  billing_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormData {
  name: string;
  legal_name?: string;
  country?: string;
  industry?: string;
  employee_size_band?: '100-149' | '150-249' | '250+';
  reporting_frequency?: 'annual' | 'triennial';
  logo_url?: string | null;
  default_currency?: string;
  default_locale?: string;
  default_timezone?: string;
  address?: string;
  vat_id?: string;
  billing_email?: string;
}

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, orgId, isLoaded } = useAuth();

  const fetchCompany = async () => {
    if (!isLoaded || !user || !orgId) {
      setCompany(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/company');
      if (!res.ok) {
        const msg = await friendlyApiError(res);
        throw new Error(msg);
      }
      const data = await res.json() as Company | null;
      setCompany(data);
    } catch (error: unknown) {
      console.error('Error fetching company:', error);
      toast.error(`Fehler beim Laden der Firmendaten: ${friendlyError(error)}`);
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
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const msg = await friendlyApiError(res);
        throw new Error(msg);
      }
      const data = await res.json() as Company;
      toast.success('Firma erfolgreich erstellt');
      setCompany(data);
      return data;
    } catch (error: unknown) {
      console.error('Error creating company:', error);
      toast.error(`Fehler beim Erstellen der Firma: ${friendlyError(error)}`);
      return null;
    }
  };

  const updateCompany = async (formData: Partial<CompanyFormData>): Promise<boolean> => {
    if (!company) {
      toast.error('Keine Firma zum Aktualisieren gefunden');
      return false;
    }

    try {
      const res = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const msg = await friendlyApiError(res);
        throw new Error(msg);
      }
      toast.success('Firma erfolgreich aktualisiert');
      await fetchCompany();
      return true;
    } catch (error: unknown) {
      console.error('Error updating company:', error);
      toast.error(`Fehler beim Aktualisieren der Firma: ${friendlyError(error)}`);
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
    currentCompany: company,
    loading,
    isLoading: loading,
    fetchCompany,
    createCompany,
    updateCompany,
  };
}
