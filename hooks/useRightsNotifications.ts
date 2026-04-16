import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface RightsNotification {
  id: string;
  organization_id: string;
  notification_year: number;
  sent_at: string;
  sent_by: string;
  recipient_count: number;
  delivery_method: 'in_app' | 'email' | 'both';
  notification_text: string | null;
  created_at: string;
}

export function useRightsNotifications() {
  const { user, orgId, isLoaded, supabase } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<RightsNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  const fetchNotifications = useCallback(async () => {
    if (!isLoaded || !user || !orgId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rights_notifications')
        .select('*')
        .eq('organization_id', orgId)
        .order('notification_year', { ascending: false });

      if (error) throw error;
      setNotifications((data || []) as RightsNotification[]);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Benachrichtigungen konnten nicht geladen werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, toast, supabase]);

  const sendNotification = useCallback(
    async (
      recipientCount: number,
      method: 'in_app' | 'email' | 'both'
    ): Promise<boolean> => {
      if (!isLoaded || !user || !orgId) return false;

      // Guard: already sent this year
      const alreadySent = notifications.some((n) => n.notification_year === currentYear);
      if (alreadySent) {
        toast({
          title: 'Bereits gesendet',
          description: `Bereits gesendet für ${currentYear}`,
        });
        return false;
      }

      try {
        const notificationText =
          `Gemäß EU-Richtlinie 2023/970 (Entgelttransparenzrichtlinie) haben Sie das Recht:\n` +
          `• Informationen über Ihr individuelles Gehaltsniveau zu erhalten\n` +
          `• Durchschnittliche Gehaltsdaten nach Geschlecht für gleichwertige Tätigkeiten anzufordern\n` +
          `• Den Gender Pay Gap in Ihrer Entgeltkategorie zu erfahren\n\n` +
          `Um Ihr Auskunftsrecht auszuüben, wenden Sie sich an die HR-Abteilung oder nutzen Sie das Mitarbeiterportal.`;

        const { error } = await supabase.from('rights_notifications').insert({
          organization_id: orgId,
          notification_year: currentYear,
          sent_at: new Date().toISOString(),
          sent_by: user.id,
          recipient_count: recipientCount,
          delivery_method: method,
          notification_text: notificationText,
        });

        if (error) throw error;

        toast({
          title: 'Benachrichtigung gesendet',
          description: `${recipientCount} Mitarbeiter wurden für ${currentYear} informiert.`,
        });
        await fetchNotifications();
        return true;
      } catch (error: unknown) {
        const msg =
          error instanceof Error
            ? error.message
            : 'Benachrichtigung konnte nicht gesendet werden';
        toast({ title: 'Fehler', description: msg, variant: 'destructive' });
        return false;
      }
    },
    [isLoaded, user, orgId, notifications, currentYear, toast, fetchNotifications, supabase]
  );

  useEffect(() => {
    if (isLoaded && user && orgId) {
      fetchNotifications();
    }
  }, [isLoaded, user, orgId, fetchNotifications]);

  const currentYearNotification =
    notifications.find((n) => n.notification_year === currentYear) ?? null;

  return {
    notifications,
    loading,
    currentYearNotification,
    hasNotifiedThisYear: currentYearNotification !== null,
    sendNotification,
    refetch: fetchNotifications,
  };
}
