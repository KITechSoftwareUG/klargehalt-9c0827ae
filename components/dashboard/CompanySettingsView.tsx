'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  Upload,
  Trash2,
  Loader2,
  Globe,
  FileText,
  Save,
} from 'lucide-react';
import { useCompany, CompanyFormData } from '@/hooks/useCompany';
import CompanySetup from '@/components/dashboard/CompanySetup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COUNTRIES = [
  { value: 'DE', label: 'Deutschland' },
  { value: 'AT', label: 'Österreich' },
  { value: 'CH', label: 'Schweiz' },
  { value: 'FR', label: 'Frankreich' },
  { value: 'NL', label: 'Niederlande' },
  { value: 'BE', label: 'Belgien' },
  { value: 'LU', label: 'Luxemburg' },
  { value: 'PL', label: 'Polen' },
  { value: 'OTHER', label: 'Anderes EU-Land' },
];

const CURRENCIES = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'CHF', label: 'Schweizer Franken (CHF)' },
  { value: 'GBP', label: 'Britisches Pfund (£)' },
  { value: 'USD', label: 'US-Dollar ($)' },
];

const LOCALES = [
  { value: 'de-DE', label: 'Deutsch (Deutschland)' },
  { value: 'de-AT', label: 'Deutsch (Österreich)' },
  { value: 'de-CH', label: 'Deutsch (Schweiz)' },
  { value: 'en-GB', label: 'Englisch (UK)' },
  { value: 'fr-FR', label: 'Französisch' },
];

const TIMEZONES = [
  { value: 'Europe/Berlin', label: 'Berlin (MEZ/MESZ)' },
  { value: 'Europe/Vienna', label: 'Wien (MEZ/MESZ)' },
  { value: 'Europe/Zurich', label: 'Zürich (MEZ/MESZ)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'UTC', label: 'UTC' },
];

const SIZE_BANDS = [
  { value: '__none', label: 'Unter 100 (keine Berichtspflicht)' },
  { value: '100-149', label: '100–149 (Bericht ab 2031, alle 3 J.)' },
  { value: '150-249', label: '150–249 (Bericht ab 2027, alle 3 J.)' },
  { value: '250+', label: '250+ (Bericht ab 2027, jährlich)' },
];

interface FormState {
  name: string;
  legal_name: string;
  industry: string;
  country: string;
  employee_size_band: string;
  default_currency: string;
  default_locale: string;
  default_timezone: string;
}

export default function CompanySettingsView() {
  const { company, loading, fetchCompany, updateCompany } = useCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? '',
        legal_name: company.legal_name ?? '',
        industry: company.industry ?? '',
        country: company.country ?? 'DE',
        employee_size_band: company.employee_size_band ?? '__none',
        default_currency: company.default_currency ?? 'EUR',
        default_locale: company.default_locale ?? 'de-DE',
        default_timezone: company.default_timezone ?? 'Europe/Berlin',
      });
      setLogoUrl(company.logo_url ?? null);
    }
  }, [company]);

  if (loading || (company && !form)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // No company yet (fresh org) → show the initial setup wizard.
  if (!company || !form) {
    return <CompanySetup onComplete={() => fetchCompany()} />;
  }

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  const dirty =
    form.name !== (company.name ?? '') ||
    form.legal_name !== (company.legal_name ?? '') ||
    form.industry !== (company.industry ?? '') ||
    form.country !== (company.country ?? 'DE') ||
    form.employee_size_band !== (company.employee_size_band ?? '__none') ||
    form.default_currency !== (company.default_currency ?? 'EUR') ||
    form.default_locale !== (company.default_locale ?? 'de-DE') ||
    form.default_timezone !== (company.default_timezone ?? 'Europe/Berlin');

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Der Firmenname darf nicht leer sein');
      return;
    }
    setSaving(true);
    const payload: Partial<CompanyFormData> = {
      name: form.name.trim(),
      legal_name: form.legal_name.trim() || undefined,
      industry: form.industry.trim() || undefined,
      country: form.country,
      employee_size_band:
        form.employee_size_band === '__none'
          ? undefined
          : (form.employee_size_band as CompanyFormData['employee_size_band']),
      default_currency: form.default_currency,
      default_locale: form.default_locale,
      default_timezone: form.default_timezone,
    };
    const ok = await updateCompany(payload);
    setSaving(false);
    if (ok) await fetchCompany();
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Datei zu groß (max. 2 MB)');
      return;
    }

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/company/logo', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Upload fehlgeschlagen');
      }
      const data = (await res.json()) as { logo_url: string };
      setLogoUrl(data.logo_url);
      toast.success('Logo aktualisiert');
      await fetchCompany();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload fehlgeschlagen';
      toast.error(message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    setUploadingLogo(true);
    try {
      const res = await fetch('/api/company/logo', { method: 'DELETE' });
      if (!res.ok) throw new Error('Logo konnte nicht entfernt werden');
      setLogoUrl(null);
      toast.success('Logo entfernt');
      await fetchCompany();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler';
      toast.error(message);
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Unternehmen</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Unternehmensdaten, Erscheinungsbild und regionale Standardeinstellungen.
        </p>
      </div>

      {/* Erscheinungsbild / Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
          <CardDescription>
            Wird in Berichten und im Portal angezeigt. PNG, JPG, SVG oder WebP,
            max. 2&nbsp;MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Firmenlogo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoSelect}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingLogo ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-4 w-4" />
                )}
                {logoUrl ? 'Logo ersetzen' : 'Logo hochladen'}
              </Button>
              {logoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={handleLogoRemove}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Entfernen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unternehmensdaten */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Unternehmensdaten</CardTitle>
              <CardDescription className="mt-0.5">
                Stammdaten Ihres Mandanten.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Firmenname *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Muster GmbH"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="legal_name">Rechtliche Bezeichnung</Label>
            <Input
              id="legal_name"
              value={form.legal_name}
              onChange={(e) => set({ legal_name: e.target.value })}
              placeholder="Muster GmbH & Co. KG"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="industry">Branche</Label>
              <Input
                id="industry"
                value={form.industry}
                onChange={(e) => set({ industry: e.target.value })}
                placeholder="IT, Produktion, Handel…"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Land</Label>
              <Select
                value={form.country}
                onValueChange={(v) => set({ country: v })}
              >
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EU-Berichtspflicht */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">EU-Berichtspflicht</CardTitle>
              <CardDescription className="mt-0.5">
                Bestimmt, ab wann die Berichtspflicht nach der
                EU-Entgelttransparenzrichtlinie 2023/970 greift.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:max-w-md">
            <Label htmlFor="size">Unternehmensgröße</Label>
            <Select
              value={form.employee_size_band}
              onValueChange={(v) => set({ employee_size_band: v })}
            >
              <SelectTrigger id="size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_BANDS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Regionale Standardeinstellungen */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">
                Regionale Standardeinstellungen
              </CardTitle>
              <CardDescription className="mt-0.5">
                Vorgaben für Währung, Sprache und Zeitzone in Gehaltsbändern,
                Entscheidungen und Berichten.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="currency">Währung</Label>
            <Select
              value={form.default_currency}
              onValueChange={(v) => set({ default_currency: v })}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="locale">Sprache / Format</Label>
            <Select
              value={form.default_locale}
              onValueChange={(v) => set({ default_locale: v })}
            >
              <SelectTrigger id="locale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tz">Zeitzone</Label>
            <Select
              value={form.default_timezone}
              onValueChange={(v) => set({ default_timezone: v })}
            >
              <SelectTrigger id="tz">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-sm backdrop-blur">
        {dirty && (
          <span className="mr-auto text-sm text-muted-foreground">
            Ungespeicherte Änderungen
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={!dirty || saving}
          onClick={() =>
            setForm({
              name: company.name ?? '',
              legal_name: company.legal_name ?? '',
              industry: company.industry ?? '',
              country: company.country ?? 'DE',
              employee_size_band: company.employee_size_band ?? '__none',
              default_currency: company.default_currency ?? 'EUR',
              default_locale: company.default_locale ?? 'de-DE',
              default_timezone: company.default_timezone ?? 'Europe/Berlin',
            })
          }
        >
          Verwerfen
        </Button>
        <Button size="sm" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Speichern
        </Button>
      </div>
    </div>
  );
}
