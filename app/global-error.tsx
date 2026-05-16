"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
              padding: '48px 40px',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Heading */}
            <h1
              style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#0f172a',
                margin: '0 0 12px',
                lineHeight: '1.3',
              }}
            >
              Etwas ist schiefgelaufen
            </h1>

            {/* Body copy */}
            <p
              style={{
                fontSize: '15px',
                color: '#64748b',
                margin: '0 0 32px',
                lineHeight: '1.6',
              }}
            >
              Ein unerwarteter Fehler ist aufgetreten. Ihre Daten sind sicher — laden
              Sie die Seite neu oder kehren Sie zur Startseite zurück.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  try {
                    reset();
                  } catch {
                    window.location.reload();
                  }
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#1d4ed8',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Seite neu laden
              </button>

              <a
                href="/dashboard"
                style={{
                  display: 'block',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontSize: '15px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                Zur Startseite
              </a>
            </div>

            {/* Support line */}
            <p
              style={{
                marginTop: '28px',
                fontSize: '13px',
                color: '#94a3b8',
                lineHeight: '1.5',
              }}
            >
              Brauchen Sie Hilfe?{' '}
              <a
                href="mailto:support@klargehalt.de"
                style={{ color: '#1d4ed8', textDecoration: 'none' }}
              >
                support@klargehalt.de
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
