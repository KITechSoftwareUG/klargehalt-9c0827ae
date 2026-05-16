import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { friendlyApiError, friendlyError } from '@/lib/api-error';

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface DepartmentFormData {
  name: string;
  parent_id?: string | null;
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, orgId, isLoaded } = useAuth();

  const fetchDepartments = async () => {
    if (!isLoaded || !user || !orgId) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/departments');
      if (!res.ok) {
        const msg = await friendlyApiError(res);
        throw new Error(msg);
      }
      const data = await res.json() as Department[];
      setDepartments(data);
    } catch (error: unknown) {
      console.error('Error fetching departments:', error);
      toast.error(`Fehler beim Laden der Abteilungen: ${friendlyError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async (formData: DepartmentFormData): Promise<Department | null> => {
    if (!user || !orgId) {
      toast.error('Keine Organisation zugeordnet');
      return null;
    }

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const msg = await friendlyApiError(res);
        throw new Error(msg);
      }
      const data = await res.json() as Department;
      toast.success('Abteilung erfolgreich erstellt');
      await fetchDepartments();
      return data;
    } catch (error: unknown) {
      console.error('Error creating department:', error);
      toast.error(`Fehler beim Erstellen der Abteilung: ${friendlyError(error)}`);
      return null;
    }
  };

  const updateDepartment = async (id: string, formData: Partial<DepartmentFormData>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const msg = await friendlyApiError(res);
        throw new Error(msg);
      }
      toast.success('Abteilung erfolgreich aktualisiert');
      await fetchDepartments();
      return true;
    } catch (error: unknown) {
      console.error('Error updating department:', error);
      toast.error(`Fehler beim Aktualisieren der Abteilung: ${friendlyError(error)}`);
      return false;
    }
  };

  const deleteDepartment = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = await friendlyApiError(res);
        throw new Error(msg);
      }
      toast.success('Abteilung erfolgreich gelöscht');
      await fetchDepartments();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting department:', error);
      toast.error(`Fehler beim Löschen der Abteilung: ${friendlyError(error)}`);
      return false;
    }
  };

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchDepartments();
    }
  }, [isLoaded, user, orgId]);

  return {
    departments,
    loading,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
