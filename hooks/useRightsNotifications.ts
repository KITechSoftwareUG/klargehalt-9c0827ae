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
  const { user, orgId, isLoaded } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<RightsNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();

  const fetchNotifications = useCallback(async () => {
    if (!isLoaded || !user || !orgId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rights-notifications');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as RightsNotification[];
      setNotifications(data);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Benachrichtigungen konnten nicht geladen werden';
      toast({ title: 'Fehler', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, orgId, toast]);

  const sendNotification = useCallback(
    async (
      recipientCount: number,
      method: 'in_app' | 'email' | 'both'
    ): Promise<boolean> => {
      if (!isLoaded || !user || !orgId) return false;

      // Client-side guard to avoid unnecessary round-trip
      const alreadySent = notifications.some((n) => n.notification_year === currentYear);
      if (alreadySent) {
        toast({
          title: 'Bereits gesendet',
          description: `Bereits gesendet für ${currentYear}`,
        });
        return false;
      }

      try {
        const res = await fetch('/api/rights-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipientCount, deliveryMethod: method }),
        });

        if (res.status === 409) {
          toast({ title: 'Bereits gesendet', description: `Bereits gesendet für ${currentYear}` });
          return false;
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? 'Benachrichtigung konnte nicht gesendet werden');
        }

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
    [isLoaded, user, orgId, notifications, currentYear, toast, fetchNotifications]
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
