import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as Department[];
      setDepartments(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error('Error fetching departments:', error);
      toast.error(`Fehler beim Laden der Abteilungen: ${message}`);
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
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as Department;
      toast.success('Abteilung erfolgreich erstellt');
      await fetchDepartments();
      return data;
    } catch (error: unknown) {
      console.error('Error creating department:', error);
      toast.error('Fehler beim Erstellen der Abteilung');
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
      if (!res.ok) throw new Error(await res.text());
      toast.success('Abteilung erfolgreich aktualisiert');
      await fetchDepartments();
      return true;
    } catch (error: unknown) {
      console.error('Error updating department:', error);
      toast.error('Fehler beim Aktualisieren der Abteilung');
      return false;
    }
  };

  const deleteDepartment = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Abteilung erfolgreich gelöscht');
      await fetchDepartments();
      return true;
    } catch (error: unknown) {
      console.error('Error deleting department:', error);
      toast.error('Fehler beim Löschen der Abteilung');
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
