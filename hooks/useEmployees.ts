import { useState, useEffect } from 'react';
import { createClientWithToken } from '@/utils/supabase/client';
import { useSession } from '@clerk/nextjs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Employee {
  id: string;
  organization_id: string;
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
  const { user, orgId, isLoaded } = useAuth();
  const { session } = useSession();

  const getSupabase = async () => {
    const token = await session?.getToken({ template: 'supabase' });
    return createClientWithToken(token || null);
  };

  const fetchEmployees = async () => {
    if (!isLoaded || !user) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = await getSupabase();
      let query = supabase.from('employees').select('*');

      if (orgId) {
        query = query.eq('organization_id', orgId);
      } else {
        // Fallback: Demo-Daten (null) oder eigene Mitarbeiter
        query = query.or(`organization_id.is.null,created_by.eq.${user.id}`);
      }

      const { data, error } = await query.order('last_name');

      if (error) throw error;
      setEmployees((data || []) as Employee[]);
    } catch (error: any) {
      console.error('Detailed error fetching employees:', error);
      toast.error(`Fehler beim Laden der Mitarbeiter: ${error.message || 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async (formData: EmployeeFormData): Promise<Employee | null> => {
    if (!user || !orgId) {
      toast.error('Keine Organisation zugeordnet');
      return null;
    }

    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('employees')
        .insert({
          ...formData,
          organization_id: orgId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Mitarbeiter erfolgreich erstellt');
      await fetchEmployees();
      return data as Employee;
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast.error('Fehler beim Erstellen des Mitarbeiters');
      return null;
    }
  };

  const updateEmployee = async (id: string, formData: Partial<EmployeeFormData>): Promise<boolean> => {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('employees')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Mitarbeiter erfolgreich aktualisiert');
      await fetchEmployees();
      return true;
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error('Fehler beim Aktualisieren des Mitarbeiters');
      return false;
    }
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Mitarbeiter erfolgreich gelöscht');
      await fetchEmployees();
      return true;
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast.error('Fehler beim Löschen des Mitarbeiters');
      return false;
    }
  };

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchEmployees();
    }
  }, [isLoaded, user, orgId]);

  return {
    employees,
    loading,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
