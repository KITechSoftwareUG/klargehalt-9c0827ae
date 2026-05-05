import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { getEffectiveTier, hasFeature, type SubscriptionStatus, type SubscriptionTier } from '@/lib/subscription';

const justificationFactorSchema = z.object({
  type: z.enum(['experience', 'education', 'performance', 'market_rate', 'seniority', 'other']),
  weight: z.number().min(0).max(1),
  score: z.number().int().min(1).max(5),
  note: z.string().optional(),
});

const createDecisionSchema = z.object({
  employee_id: z.string().uuid(),
  decision_type: z.enum(['hire', 'raise', 'promotion', 'band_change', 'correction']),
  old_salary: z.number().positive().nullable().optional(),
  new_salary: z.number().positive(),
  justification_text: z.string().min(10, 'Begründung muss mindestens 10 Zeichen haben'),
  justification_factors: z.array(justificationFactorSchema).default([]),
  decided_at: z.string().datetime({ offset: true }).optional(),
  pay_band_id: z.string().uuid().nullable().optional(),
  comparator_data: z.record(z.unknown()).default({}),
  lawyer_review_id: z.string().uuid().nullable().optional(),
});

const supabaseAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const supabase = supabaseAdmin();

  const { data: company } = await supabase
    .from('companies')
    .select('subscription_tier, subscription_status, trial_ends_at')
    .eq('organization_id', guard.orgId)
    .maybeSingle();

  const effectiveTier = getEffectiveTier(
    (company?.subscription_tier as SubscriptionTier | null) ?? 'basis',
    (company?.subscription_status as SubscriptionStatus | null) ?? 'canceled',
    company?.trial_ends_at ?? null,
  );
  if (!hasFeature(effectiveTier, 'decision_documentation')) {
    return NextResponse.json({ error: 'Professional plan required for decision documentation' }, { status: 402 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { data, error } = await supabase
    .from('salary_decisions')
    .insert({
	      ...parsed.data,
	      organization_id: guard.orgId,
	      decided_by_user_id: guard.userId,
      decided_at: parsed.data.decided_at ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('salary_decisions insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void supabase.from('audit_logs').insert({
	    organization_id: guard.orgId,
	    user_id: guard.userId,
    action: 'create',
    entity_type: 'salary_decisions',
    entity_id: data.id,
    after_state: data,
  });

  return NextResponse.json({ success: true, data }, { status: 201 });
}
