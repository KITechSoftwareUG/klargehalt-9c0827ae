import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('rights_notifications')
    .select('id, organization_id, notification_year, sent_at, sent_by, recipient_count, delivery_method, notification_text, created_at')
    .eq('organization_id', orgId)
    .order('notification_year', { ascending: false });

  if (error) {
    console.error('rights-notifications GET error:', error);
    return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { orgId, userId } = guard;

  const body = await request.json() as {
    recipientCount?: unknown;
    deliveryMethod?: unknown;
  };

  const recipientCount = typeof body.recipientCount === 'number' && body.recipientCount >= 0
    ? body.recipientCount
    : null;

  const allowedMethods = ['in_app', 'email', 'both'] as const;
  type DeliveryMethod = typeof allowedMethods[number];
  const deliveryMethod: DeliveryMethod | null = allowedMethods.includes(body.deliveryMethod as DeliveryMethod)
    ? (body.deliveryMethod as DeliveryMethod)
    : null;

  if (recipientCount === null || deliveryMethod === null) {
    return NextResponse.json(
      { error: 'recipientCount (number) and deliveryMethod (in_app|email|both) are required' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const currentYear = new Date().getFullYear();

  // Guard: only one notification per org per year
  const { data: existing } = await supabase
    .from('rights_notifications')
    .select('id')
    .eq('organization_id', orgId)
    .eq('notification_year', currentYear)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `Bereits gesendet für ${currentYear}` },
      { status: 409 }
    );
  }

  const notificationText =
    `Gemäß EU-Richtlinie 2023/970 (Entgelttransparenzrichtlinie) haben Sie das Recht:\n` +
    `• Informationen über Ihr individuelles Gehaltsniveau zu erhalten\n` +
    `• Durchschnittliche Gehaltsdaten nach Geschlecht für gleichwertige Tätigkeiten anzufordern\n` +
    `• Den Gender Pay Gap in Ihrer Entgeltkategorie zu erfahren\n\n` +
    `Um Ihr Auskunftsrecht auszuüben, wenden Sie sich an die HR-Abteilung.`;

  const { data, error } = await supabase
    .from('rights_notifications')
    .insert({
      organization_id: orgId,
      notification_year: currentYear,
      sent_at: new Date().toISOString(),    // server-controlled, not client
      sent_by: userId,                       // server-controlled, not client
      recipient_count: recipientCount,
      delivery_method: deliveryMethod,
      notification_text: notificationText,
    })
    .select('id, notification_year, sent_at, recipient_count, delivery_method')
    .single();

  if (error) {
    console.error('rights-notifications POST error:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen der Benachrichtigung' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
