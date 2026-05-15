// Sentry client-side configuration.
// Klargehalt processes DSGVO Art. 9 data (gender, salary). Replay must mask all
// text/inputs/media — otherwise HR session replays leak salary tables to a
// subprocessor. PII scrubbing applied to every event before transmission.

import * as Sentry from "@sentry/nextjs";

type SentryEvent = Parameters<NonNullable<Parameters<typeof Sentry.init>[0]['beforeSend']>>[0];

const PII_KEY_PATTERNS = /(email|name|salary|gehalt|gender|geschlecht|phone|telefon|address|adresse|birth|geburt|ssn|steuer|iban|bic|cookie|authorization|secret|token|password|passwort)/i;

const scrubObject = (obj: unknown, depth = 0): unknown => {
  if (depth > 4 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => scrubObject(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_KEY_PATTERNS.test(k)) {
      out[k] = '[redacted]';
    } else if (typeof v === 'object') {
      out[k] = scrubObject(v, depth + 1);
    } else {
      out[k] = v;
    }
  }
  return out;
};

const scrubEvent = (event: SentryEvent): SentryEvent => {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.headers) {
      const safe: Record<string, string> = {};
      for (const [k, v] of Object.entries(event.request.headers)) {
        if (!PII_KEY_PATTERNS.test(k)) safe[k] = v as string;
      }
      event.request.headers = safe;
    }
  }
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }
  if (event.extra) event.extra = scrubObject(event.extra) as typeof event.extra;
  if (event.contexts) event.contexts = scrubObject(event.contexts) as typeof event.contexts;
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => ({
      ...b,
      data: b.data ? (scrubObject(b.data) as typeof b.data) : b.data,
    }));
  }
  return event;
};

Sentry.init({
  dsn: "https://16146e84da4d8e72ebfe0d6d9b8684c9@o4510663552335872.ingest.de.sentry.io/4510714186039376",

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
      networkDetailAllowUrls: [],
    }),
  ],

  environment: process.env.NODE_ENV || 'production',

  tracesSampleRate: 0.2,

  sendDefaultPii: false,
  enableLogs: false,

  // Replays only sampled on errors — disable session sampling entirely so we
  // never capture an HR manager casually browsing salary tables.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.5,

  beforeSend: scrubEvent,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
