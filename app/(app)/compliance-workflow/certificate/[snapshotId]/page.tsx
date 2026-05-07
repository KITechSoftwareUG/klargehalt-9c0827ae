import { notFound } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { PrintButton } from '@/components/PrintButton';
import type { CertifiedSnapshot, ComplianceAssessment, SnapshotData } from '@/lib/types/compliance-workflow';

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ snapshotId: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CertificatePage({ params }: PageProps) {
  const { snapshotId } = await params;

  const supabase = await createClient();
  const adminClient = createServiceClient();

  // 1. Fetch the certified snapshot
  const { data: snapshot, error: snapshotError } = await supabase
    .from('certified_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (snapshotError || !snapshot) {
    notFound();
  }

  const typedSnapshot = snapshot as CertifiedSnapshot;

  // 2. Fetch the compliance assessment
  const { data: assessment } = await supabase
    .from('compliance_assessments')
    .select('*')
    .eq('id', typedSnapshot.assessment_id)
    .single();

  const typedAssessment = assessment as ComplianceAssessment | null;

  // 3. Fetch the company name
  let companyName = '—';
  if (typedAssessment?.organization_id) {
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('organization_id', typedAssessment.organization_id)
      .single();
    if (company?.name) {
      companyName = company.name as string;
    }
  }

  // 4. Fetch the lawyer name via Service Role (auth.admin access)
  let lawyerName = '—';
  if (typedSnapshot.lawyer_id) {
    const { data: lawyerData } = await adminClient.auth.admin.getUserById(
      typedSnapshot.lawyer_id,
    );
    if (lawyerData?.user) {
      const meta = lawyerData.user.user_metadata as Record<string, unknown>;
      const metaName = typeof meta?.name === 'string' ? meta.name : null;
      lawyerName = metaName || lawyerData.user.email || '—';
    }
  }

  const snapshotData = typedSnapshot.snapshot_data as SnapshotData;

  return (
    <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0">
      {/* Print action bar — hidden when printing */}
      <div className="print:hidden mb-6 flex justify-center">
        <div className="flex items-center gap-4">
          <a
            href="/compliance-workflow"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Zurück zu Compliance-Prüfungen
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Certificate card */}
      <div className="mx-auto max-w-[800px] bg-white shadow-xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-full">

        {/* Header bar */}
        <div className="bg-[#071423] px-10 py-7 flex items-center justify-between">
          <span className="text-white font-bold text-2xl tracking-tight">
            KlarGehalt
          </span>
          <span className="text-slate-400 text-xs tracking-widest uppercase">
            Compliance-Zertifikat
          </span>
        </div>

        {/* Main content */}
        <div className="px-10 py-8 space-y-8">

          {/* Title block */}
          <div className="space-y-1 border-b-2 border-[#071423] pb-5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              COMPLIANCE-ZERTIFIKAT
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Entgelttransparenzrichtlinie (EU) 2023/970
            </p>
          </div>

          {/* Company & assessment info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="font-semibold text-slate-700">Unternehmen:</span>{' '}
              <span className="text-slate-900">{companyName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Prüfungstitel:</span>{' '}
              <span className="text-slate-900">
                {typedAssessment?.title ?? '—'}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-semibold text-slate-700">Prüfungszeitraum:</span>{' '}
              <span className="text-slate-900">
                {formatDateShort(typedAssessment?.period_from)}{' '}
                –{' '}
                {formatDateShort(typedAssessment?.period_to)}
              </span>
            </div>
          </div>

          {/* Lawyer confirmation box */}
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-6 py-5 space-y-3">
            <div className="flex items-center gap-2">
              {/* Checkmark icon (inline SVG — no external dependency) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-600 shrink-0"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="font-bold text-emerald-900 text-base">
                Von externem Rechtsberater geprüft
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-6 text-sm text-emerald-800">
              <div>
                <span className="font-semibold">Rechtsberater:</span>{' '}
                <span>{lawyerName}</span>
              </div>
              <div>
                <span className="font-semibold">Geprüft am:</span>{' '}
                <span>{formatDateLong(typedSnapshot.certified_at)}</span>
              </div>
              <div>
                <span className="font-semibold">Gültig bis:</span>{' '}
                <span>{formatDateLong(typedSnapshot.valid_until)}</span>
              </div>
            </div>
          </div>

          {/* Lawyer statement */}
          {typedSnapshot.lawyer_statement && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                Stellungnahme des Rechtsberaters:
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-800 italic leading-relaxed">
                &ldquo;{typedSnapshot.lawyer_statement}&rdquo;
              </div>
            </div>
          )}

          {/* Audited data basis */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              Geprüfte Datenbasis:
            </p>
            <ul className="space-y-1.5 text-sm text-slate-800">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                <span>
                  <span className="font-medium tabular-nums">
                    {snapshotData.employees_count}
                  </span>{' '}
                  Mitarbeiter
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                <span>
                  <span className="font-medium tabular-nums">
                    {snapshotData.salary_decisions_count}
                  </span>{' '}
                  dokumentierte Gehaltsentscheidungen
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                <span>
                  <span className="font-medium tabular-nums">
                    {Array.isArray(snapshotData.pay_bands)
                      ? snapshotData.pay_bands.length
                      : 0}
                  </span>{' '}
                  Gehaltsbänder
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                <span>
                  <span className="font-medium tabular-nums">
                    {Array.isArray(snapshotData.job_profiles)
                      ? snapshotData.job_profiles.length
                      : 0}
                  </span>{' '}
                  Job-Profile
                </span>
              </li>
            </ul>
          </div>

          {/* Divider + document ID */}
          <div className="border-t border-slate-200 pt-5 space-y-1 text-xs text-slate-500">
            <p>
              <span className="font-semibold">Dokument-ID:</span>{' '}
              <span className="font-mono">{typedSnapshot.id}</span>
            </p>
            <p>
              <span className="font-semibold">Erstellt:</span>{' '}
              {formatDateLong(typedSnapshot.certified_at)}
            </p>
          </div>

          {/* Disclaimer */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5 text-amber-600"
              aria-hidden="true"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p>
              Dieses Dokument wurde durch KlarGehalt generiert. Die Prüfung
              wurde durch einen unabhängigen Rechtsberater durchgeführt.
              KlarGehalt GmbH übernimmt keine Haftung für den Inhalt der
              anwaltlichen Bewertung.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
