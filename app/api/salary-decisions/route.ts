import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';

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

  // Cross-tenant FK guard: service_role bypasses RLS, so we MUST verify every
  // FK target belongs to the caller's org. Otherwise an admin in Org A could
  // attach a salary_decision to Org B's employee/pay_band/lawyer_review and
  // pollute the audit trail — destroying the integrity guarantee that is the
  // product's core legal value.
  const { data: emp } = await supabase
    .from('employees')
    .select('id')
    .eq('id', parsed.data.employee_id)
    .eq('organization_id', guard.orgId)
    .maybeSingle();
  if (!emp) {
    return NextResponse.json(
      { error: 'Employee not found in your organization' },
      { status: 422 },
    );
  }

  if (parsed.data.pay_band_id) {
    const { data: band } = await supabase
      .from('pay_bands')
      .select('id')
      .eq('id', parsed.data.pay_band_id)
      .eq('organization_id', guard.orgId)
      .maybeSingle();
    if (!band) {
      return NextResponse.json(
        { error: 'Pay band not found in your organization' },
        { status: 422 },
      );
    }
  }

  if (parsed.data.lawyer_review_id) {
    const { data: review } = await supabase
      .from('lawyer_reviews')
      .select('id')
      .eq('id', parsed.data.lawyer_review_id)
      .eq('organization_id', guard.orgId)
      .maybeSingle();
    if (!review) {
      return NextResponse.json(
        { error: 'Lawyer review not found in your organization' },
        { status: 422 },
      );
    }
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

  return NextResponse.json({ success: true, data }, { status: 201 });
}
