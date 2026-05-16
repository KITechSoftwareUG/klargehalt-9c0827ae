import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEntry } from '@/lib/audit-log';
import { CONTRACT_VERSION, CONTRACT_CONTENT_HASH, REQUIRED_DOCUMENTS } from '@/lib/contracts';

const acceptSchema = z.object({
  acceptedAgbDse: z.literal(true),
  acceptedAvv: z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    const context = await getServerAuthContext();
    const guard = await guardRole(context, ['admin']);
    if (guard instanceof NextResponse) return guard;

    if (!(await checkRateLimit(`contracts-accept:${guard.orgId}`, 5, 60 * 60 * 1000))) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte kurz warten.' }, { status: 429 });
    }

    const parsed = acceptSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bitte bestätigen Sie beide Kontrollkästchen, um fortzufahren.' },
        { status: 400 }
      );
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null;
    const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null;

    const supabase = createServiceClient();

    const { error: insertError } = await supabase.from('contract_acceptances').insert({
      organization_id: guard.orgId,
      accepted_by_user_id: guard.userId,
      document_keys: REQUIRED_DOCUMENTS.map((d) => d.key),
      document_version: CONTRACT_VERSION,
      content_hash: CONTRACT_CONTENT_HASH,
      ip,
      user_agent: userAgent,
    });
    if (insertError) {
      console.error('Contracts accept: insert failed', insertError.message);
      return NextResponse.json({ error: 'Speichern fehlgeschlagen. Bitte erneut versuchen.' }, { status: 500 });
    }

    await supabase
      .from('companies')
      .update({ contracts_accepted_at: new Date().toISOString() })
      .eq('organization_id', guard.orgId);

    void logAuditEntry(supabase, {
      orgId: guard.orgId,
      userId: guard.userId,
      userEmail: context.user?.email ?? null,
      userRole: guard.role,
      action: 'update',
      entityType: 'company',
      entityName: 'Vertragsbedingungen akzeptiert',
      metadata: {
        event: 'contracts_accepted',
        document_version: CONTRACT_VERSION,
        document_keys: REQUIRED_DOCUMENTS.map((d) => d.key),
        content_hash: CONTRACT_CONTENT_HASH,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contracts accept: unexpected error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
