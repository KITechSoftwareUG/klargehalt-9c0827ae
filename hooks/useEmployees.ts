import { useState, useEffect } from 'react';
import { createClientWithToken } from '@/utils/supabase/client';
import { useUser, useSession } from '@clerk/nextjs';
import { toast } from 'sonner';

export interface Employee {
  id: string;
  company_id: string;
  user_id: string | null;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  gender: string | null;
  birth_date: string | null;
  hire_date: string | null;
  job_profile_id: string | null;
  job_level: string | null;
  department: string | null;
  location: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  employee_number?: string;
  first_name: string;
  last_name: string;
  email?: string;
  gender?: 'male' | 'female' | 'diverse' | 'not_specified';
  birth_date?: string;
  hire_date?: string;
  job_profile_id?: string;
  job_level?: 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'director';
  department?: string;
  location?: string;
  is_active: boolean;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoaded } = useUser();
  const { session } = useSession();

  const getSupabase = async () => {
    let token = null;
    try {
      token = await session?.getToken({ template: 'supabase' });
    } catch (e) {
      console.error('Clerk Supabase Token Error:', e);
    }
    return createClientWithToken(token || null);
  };

  const fetchEmployees = async () => {
    if (!isLoaded || !user) return;

    setLoading(true);
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('last_name');

    if (error) {
      console.error('Error fetching employees:', error);
      toast.error(`Fehler beim Laden der Mitarbeiter: ${error.message}`);
    } else {
      setEmployees((data || []) as Employee[]);
    }
    setLoading(false);
  };

  const getCompanyId = async (): Promise<string | null> => {
    if (!user) return null;

    const supabase = await getSupabase();
    const { data } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    return data?.company_id || null;
  };

  const createEmployee = async (formData: EmployeeFormData): Promise<Employee | null> => {
    if (!user) return null;

    const companyId = await getCompanyId();
    if (!companyId) {
      toast.error('Keine Firma zugeordnet');
      return null;
    }

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('employees')
      .insert({
        ...formData,
        company_id: companyId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating employee:', error);
      toast.error('Fehler beim Erstellen des Mitarbeiters');
      return null;
    }

    toast.success('Mitarbeiter erfolgreich erstellt');
    await fetchEmployees();
    return data as Employee;
  };

  const updateEmployee = async (id: string, formData: Partial<EmployeeFormData>): Promise<boolean> => {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('employees')
      .update(formData)
      .eq('id', id);

    if (error) {
      console.error('Error updating employee:', error);
      toast.error('Fehler beim Aktualisieren des Mitarbeiters');
      return false;
    }

    toast.success('Mitarbeiter erfolgreich aktualisiert');
    await fetchEmployees();
    return true;
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting employee:', error);
      toast.error('Fehler beim Löschen des Mitarbeiters');
      return false;
    }

    toast.success('Mitarbeiter erfolgreich gelöscht');
    await fetchEmployees();
    return true;
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchEmployees();
    }
  }, [isLoaded, user]);

  return {
    employees,
    loading,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
