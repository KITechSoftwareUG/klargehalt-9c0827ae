import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_NOREPLY = 'KlarGehalt <noreply@klargehalt.de>';
const FROM_SUPPORT = 'KlarGehalt Support <support@klargehalt.de>';

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const displayName = name || 'dort';
  await resend.emails.send({
    from: FROM_NOREPLY,
    to,
    subject: 'Willkommen bei KlarGehalt',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #071423; margin-top: 0;">Willkommen ${displayName}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Ihr Konto ist aktiviert. Sie können jetzt mit KlarGehalt Ihre EU-Entgelttransparenz umsetzen —
            Gehaltsstrukturen dokumentieren, Gender Pay Gap analysieren und Berichte erstellen.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Sie starten mit einem <strong>14-tägigen Professional-Test</strong> — alle Features freigeschaltet, keine Kreditkarte nötig.
          </p>
          <a href="https://app.klargehalt.de/dashboard"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Zum Dashboard
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen? Antworten Sie auf diese Mail oder schreiben Sie an
            <a href="mailto:support@klargehalt.de" style="color: #2563eb;">support@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendTrialEndingEmail(
  to: string,
  name: string,
  daysLeft: number,
  companyName: string
): Promise<void> {
  const displayName = name || 'dort';
  await resend.emails.send({
    from: FROM_NOREPLY,
    to,
    subject: `Ihr KlarGehalt-Test endet in ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tagen'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #071423; margin-top: 0;">Ihr Test endet bald</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hallo ${displayName}, der Professional-Test für <strong>${companyName}</strong> endet
            in <strong>${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tagen'}</strong>.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Upgraden Sie jetzt, damit Ihr Team weiterhin auf alle Features zugreifen kann —
            Pay-Gap-Analysen, PDF-Berichte und Entgelttransparenz-Auswertungen.
          </p>
          <a href="https://app.klargehalt.de/dashboard"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Jetzt upgraden
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen zu den Tarifen?
            <a href="mailto:support@klargehalt.de" style="color: #2563eb;">support@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendPaymentFailedEmail(
  to: string,
  name: string,
  companyName: string
): Promise<void> {
  const displayName = name || 'dort';
  await resend.emails.send({
    from: FROM_SUPPORT,
    to,
    subject: 'Zahlung fehlgeschlagen — Bitte Zahlungsmittel aktualisieren',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #dc2626; margin-top: 0;">Zahlung fehlgeschlagen</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hallo ${displayName}, die letzte Zahlung für <strong>${companyName}</strong> konnte leider
            nicht verarbeitet werden.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Bitte aktualisieren Sie Ihr Zahlungsmittel, um eine Unterbrechung Ihres Zugangs zu vermeiden.
          </p>
          <a href="https://app.klargehalt.de/dashboard"
             style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Zahlungsmittel aktualisieren
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Hilfe benötigt?
            <a href="mailto:billing@klargehalt.de" style="color: #2563eb;">billing@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}
