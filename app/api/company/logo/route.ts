import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';

const BUCKET = 'company-logos';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB — keep in sync with the bucket migration
const ALLOWED = new Map<string, string>([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/svg+xml', 'svg'],
  ['image/webp', 'webp'],
]);

/**
 * Uploads a company logo to the public `company-logos` bucket under the
 * org-scoped prefix `<orgId>/logo-<ts>.<ext>` and writes the resulting public
 * URL onto companies.logo_url. Admin-only.
 */
export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin']);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei übermittelt' }, { status: 400 });
  }

  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: 'Nur PNG, JPG, SVG oder WebP erlaubt' },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Datei zu groß (max. 2 MB)' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const objectPath = `${orgId}/logo-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('logo upload error:', uploadError.message);
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const logoUrl = pub.publicUrl;

  // Remove any previous logo objects so the bucket doesn't accumulate orphans.
  const { data: existing } = await supabase.storage.from(BUCKET).list(orgId);
  const stale = (existing ?? [])
    .map((o) => `${orgId}/${o.name}`)
    .filter((p) => p !== objectPath);
  if (stale.length > 0) {
    await supabase.storage.from(BUCKET).remove(stale);
  }

  const { error: dbError } = await supabase
    .from('companies')
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId);

  if (dbError) {
    console.error('logo url persist error:', dbError.message);
    return NextResponse.json({ error: 'Logo konnte nicht gespeichert werden' }, { status: 500 });
  }

  return NextResponse.json({ logo_url: logoUrl });
}

/**
 * Removes the company logo (storage objects + companies.logo_url). Admin-only.
 */
export async function DELETE() {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['admin']);
  if (guard instanceof NextResponse) return guard;

  const { orgId } = guard;
  const supabase = createServiceClient();

  const { data: existing } = await supabase.storage.from(BUCKET).list(orgId);
  const paths = (existing ?? []).map((o) => `${orgId}/${o.name}`);
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error: dbError } = await supabase
    .from('companies')
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq('organization_id', orgId);

  if (dbError) {
    console.error('logo delete persist error:', dbError.message);
    return NextResponse.json({ error: 'Logo konnte nicht entfernt werden' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
