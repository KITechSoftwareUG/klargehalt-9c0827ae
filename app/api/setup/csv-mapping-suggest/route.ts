import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerAuthContext } from '@/lib/auth/server';
import { guardRole } from '@/lib/auth/api-guard';
import { checkRateLimit } from '@/lib/rate-limit';

const bodySchema = z.object({
  csvHeaders: z.array(z.string().min(1).max(200)).min(1).max(80),
});

// Catalog of klargehalt employee fields the model is allowed to map to.
// Keep in sync with EMPLOYEE_FIELDS in components/dashboard/setup/MitarbeiterImportView.tsx.
const TARGET_FIELDS = [
  { key: 'first_name', label: 'Vorname', required: true },
  { key: 'last_name', label: 'Nachname', required: true },
  { key: 'gender', label: 'Geschlecht (male/female/diverse/not_specified)', required: true },
  { key: 'employment_type', label: 'Anstellungsart (full_time/part_time/contract)', required: true },
  { key: 'hire_date', label: 'Einstellungsdatum (DD.MM.YYYY oder YYYY-MM-DD)', required: true },
  { key: 'base_salary', label: 'Grundgehalt Jahresbrutto in EUR', required: true },
  { key: 'email', label: 'E-Mail-Adresse', required: false },
  { key: 'department_name', label: 'Abteilung (Name)', required: false },
  { key: 'job_profile_title', label: 'Job-Profil / Position / Rolle', required: false },
  { key: 'job_level_name', label: 'Karrierestufe / Seniorität', required: false },
  { key: 'employee_number', label: 'Mitarbeiter- oder Personalnummer', required: false },
  { key: 'birth_year', label: 'Geburtsjahr', required: false },
  { key: 'variable_pay', label: 'Variabler Anteil / Bonus in EUR', required: false },
  { key: 'weekly_hours', label: 'Wochenstunden', required: false },
  { key: 'location', label: 'Standort / Ort', required: false },
];

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_TIMEOUT_MS = 8000;

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

function buildPrompt(csvHeaders: string[]): string {
  const fieldList = TARGET_FIELDS.map(
    (f) => `  - ${f.key}: ${f.label}${f.required ? ' (Pflichtfeld)' : ''}`
  ).join('\n');

  const headerList = csvHeaders.map((h) => `  - "${h}"`).join('\n');

  return `Du ordnest CSV-Spalten einem festen Zielschema für HR-Daten zu.

Zielfelder (key → Beschreibung):
${fieldList}

Verfügbare CSV-Spalten:
${headerList}

Aufgabe:
- Wähle für jedes Zielfeld die passendste CSV-Spalte aus der obigen Liste, oder lass sie weg, wenn keine wirklich passt.
- Sprachen: Deutsch und Englisch möglich. Beachte Abkürzungen (z.B. "Geb." → Geburtsjahr, "MA-Nr." → employee_number).
- Vorname und Nachname können auch in einer kombinierten "Name"-Spalte stecken — in diesem Fall ordne beide diesem Header zu (der Importer splittet später).
- Antworte ausschließlich mit gültigem JSON: { "mapping": { "<field_key>": "<csv_header>" } }
- Nur Felder aufnehmen, für die du sicher bist. Lieber weniger als falsch zuordnen.`;
}

function safeExtractJson(text: string): unknown {
  // Gemini occasionally wraps JSON in code fences despite responseMimeType.
  const fenced = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(text);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate);
}

export async function POST(request: NextRequest) {
  const context = await getServerAuthContext();
  const guard = await guardRole(context, ['owner', 'admin', 'hr_manager']);
  if (guard instanceof NextResponse) return guard;

  const { userId } = guard;

  const allowed = await checkRateLimit(`csv-mapping:${userId}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte warten Sie kurz und versuchen Sie es erneut.' },
      { status: 429 }
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json();
    parsed = bodySchema.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'KI-Mapping ist derzeit nicht verfügbar.' },
      { status: 503 }
    );
  }

  const prompt = buildPrompt(parsed.csvHeaders);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            maxOutputTokens: 1024,
          },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      console.error('Gemini API error:', res.status);
      return NextResponse.json(
        { error: 'KI-Mapping fehlgeschlagen — bitte manuell zuordnen.' },
        { status: 502 }
      );
    }

    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json(
        { error: 'KI-Mapping lieferte keine Antwort.' },
        { status: 502 }
      );
    }

    let raw: unknown;
    try {
      raw = safeExtractJson(text);
    } catch {
      return NextResponse.json(
        { error: 'KI-Antwort konnte nicht gelesen werden.' },
        { status: 502 }
      );
    }

    const rawMapping =
      raw && typeof raw === 'object' && 'mapping' in raw
        ? (raw as { mapping: unknown }).mapping
        : raw;

    if (!rawMapping || typeof rawMapping !== 'object') {
      return NextResponse.json({ mapping: {} });
    }

    const allowedKeys = new Set(TARGET_FIELDS.map((f) => f.key));
    const allowedHeaders = new Set(parsed.csvHeaders);
    const mapping: Record<string, string> = {};

    for (const [key, value] of Object.entries(rawMapping as Record<string, unknown>)) {
      if (
        allowedKeys.has(key) &&
        typeof value === 'string' &&
        allowedHeaders.has(value)
      ) {
        mapping[key] = value;
      }
    }

    return NextResponse.json({ mapping });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'KI-Mapping hat zu lange gedauert.' },
        { status: 504 }
      );
    }
    console.error('csv-mapping-suggest error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json(
      { error: 'KI-Mapping fehlgeschlagen — bitte manuell zuordnen.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
