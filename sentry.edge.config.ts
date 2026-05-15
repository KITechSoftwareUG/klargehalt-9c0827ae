// Sentry edge runtime configuration (middleware + edge route handlers).
// Klargehalt processes DSGVO Art. 9 data — PII never goes to Sentry.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://16146e84da4d8e72ebfe0d6d9b8684c9@o4510663552335872.ingest.de.sentry.io/4510714186039376",

  environment: process.env.NODE_ENV || 'production',

  tracesSampleRate: 0.2,

  sendDefaultPii: false,
  enableLogs: false,
});
