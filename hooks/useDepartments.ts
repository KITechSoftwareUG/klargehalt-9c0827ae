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
  const { user, orgId, isLoaded, supabase } = useAuth();

  const fetchDepartments = async () => {
    if (!isLoaded || !user) {
      setDepartments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase.from('departments').select('*');

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Unbekannter Fehler';
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
      const { data, error } = await supabase
        .from('departments')
        .insert({
          ...formData,
          organization_id: orgId,
        })
        .select()
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from('departments')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

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
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
