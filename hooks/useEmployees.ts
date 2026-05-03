import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { SalaryJustification } from '@/lib/types/salary-justification';

export interface Employee {
  id: string;
  organization_id: string;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  gender: 'male' | 'female' | 'diverse' | 'not_specified';
  birth_year: number | null;
  job_profile_id: string | null;
  job_level_id: string | null;
  department_id: string | null;
  employment_type: 'full_time' | 'part_time' | 'contract';
  location: string | null;
  hire_date: string;
  base_salary: number;
  variable_pay: number;
  weekly_hours: number;
  currency: string;
  pay_band_id: string | null;
  on_leave: boolean;
  leave_type: string | null;
  leave_start: string | null;
  leave_end: string | null;
  user_id: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  salary_justification: SalaryJustification | null;
  salary_justification_updated_at: string | null;
  salary_justification_updated_by: string | null;
  creator_profile?: { full_name: string | null; email: string } | null;
}

export interface EmployeeFormData {
  employee_number?: string;
  first_name: string;
  last_name: string;
  email?: string;
  gender: 'male' | 'female' | 'diverse' | 'not_specified';
  birth_year?: number;
  job_profile_id?: string;
  job_level_id?: string;
  department_id?: string;
  employment_type: 'full_time' | 'part_time' | 'contract';
  location?: string;
  hire_date: string;
  base_salary: number;
  variable_pay?: number;
  weekly_hours?: number;
  currency?: string;
  pay_band_id?: string;
  is_active: boolean;
  salary_justification?: SalaryJustification;
  salary_justification_updated_at?: string;
  salary_justification_updated_by?: string;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, orgId, isLoaded } = useAuth();

  const fetchEmployees = async () => {
    if (!isLoaded || !user || !orgId) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as Employee[];
      setEmployees(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error fetching employees:', error);
      toast.error(`Fehler beim Laden der Mitarbeiter: ${message}`);
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
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as Employee;
      toast.success('Mitarbeiter erfolgreich erstellt');
      await fetchEmployees();
      return data;
    } catch (error: unknown) {
      console.error('Error creating employee:', error);
      toast.error('Fehler beim Erstellen des Mitarbeiters');
      return null;
    }
  };

  const updateEmployee = async (id: string, formData: Partial<EmployeeFormData>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Mitarbeiter erfolgreich aktualisiert');
      await fetchEmployees();
      return true;
    } catch (error: unknown) {
      console.error('Error updating employee:', error);
      toast.error('Fehler beim Aktualisieren des Mitarbeiters');
      return false;
    }
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Mitarbeiter erfolgreich archiviert');
      await fetchEmployees();
      return true;
    } catch (error: unknown) {
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
