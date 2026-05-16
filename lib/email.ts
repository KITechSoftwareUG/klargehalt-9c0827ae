import { Resend } from 'resend';

// Lazy singleton — the Resend constructor throws if RESEND_API_KEY is unset,
// which breaks `next build` during page-data collection for any route that
// imports this module. Deferring instantiation keeps build safe while still
// erroring loudly at request time when the key is actually missing.
let resendClient: Resend | null = null;
const getResend = (): Resend => {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

const FROM_NOREPLY = 'KlarGehalt <noreply@klargehalt.de>';
const FROM_SUPPORT = 'KlarGehalt Support <support@klargehalt.de>';

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const displayName = name || 'dort';
  await getResend().emails.send({
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
            Ihr Konto ist aktiviert. Sie starten mit einem <strong>14-tägigen Professional-Test</strong> —
            alle Features freigeschaltet, keine Kreditkarte nötig.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 12px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Empfehlung für diese Woche</p>
            <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
              <span style="color: #2563eb; font-weight: 700; min-width: 20px;">1.</span>
              <span style="color: #334155; line-height: 1.5;">Mitarbeiter anlegen und Gehälter erfassen</span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
              <span style="color: #2563eb; font-weight: 700; min-width: 20px;">2.</span>
              <span style="color: #334155; line-height: 1.5;">Pay-Gap-Report generieren und erste Lücken erkennen</span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <span style="color: #2563eb; font-weight: 700; min-width: 20px;">3.</span>
              <span style="color: #334155; line-height: 1.5;">Erste Gehaltsentscheidung dokumentieren — das ist der Compliance-Kern</span>
            </div>
          </div>
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
  await getResend().emails.send({
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

export async function sendMidTrialEmail(
  to: string,
  name: string,
  companyName: string
): Promise<void> {
  const displayName = name || 'dort';
  await getResend().emails.send({
    from: FROM_NOREPLY,
    to,
    subject: `${companyName} — wie läuft Ihre Testphase?`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #071423; margin-top: 0;">Sie sind auf dem richtigen Weg</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hallo ${displayName}, Ihre Testphase für <strong>${companyName}</strong> läuft seit 5 Tagen.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Unternehmen, die KlarGehalt für die EU-Entgelttransparenzrichtlinie nutzen, profitieren vor allem von
            drei Dingen: einem lückenlosen Gehaltsentscheidungsprotokoll, dem automatischen Gender Pay Gap Report
            und dem anwaltlich geprüften Compliance-Nachweis.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 12px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Noch nicht ausprobiert?</p>
            <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
              <span style="color: #2563eb; min-width: 16px;">→</span>
              <span style="color: #334155; line-height: 1.5; font-size: 14px;">Pay-Gap-Report: Erkennen Sie Lücken bevor es ein Mitarbeiter tut</span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
              <span style="color: #2563eb; min-width: 16px;">→</span>
              <span style="color: #334155; line-height: 1.5; font-size: 14px;">Gehaltsentscheidung dokumentieren: Jede Gehaltsänderung nachvollziehbar und mit dokumentiertem Begründungs-Trail festhalten</span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <span style="color: #2563eb; min-width: 16px;">→</span>
              <span style="color: #334155; line-height: 1.5; font-size: 14px;">Anwaltsprüfung anfragen: Externes Gutachten als Nachweis</span>
            </div>
          </div>
          <a href="https://app.klargehalt.de/dashboard"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Weiter einrichten
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen? Wir helfen gerne.
            <a href="mailto:support@klargehalt.de" style="color: #2563eb;">support@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendSubscriptionConfirmedEmail(
  to: string,
  name: string,
  companyName: string,
  tier: string
): Promise<void> {
  const displayName = name || 'dort';
  const tierLabel = tier === 'professional' ? 'Professional' : tier === 'enterprise' ? 'Enterprise' : 'Basis';
  await getResend().emails.send({
    from: FROM_NOREPLY,
    to,
    subject: `KlarGehalt ${tierLabel} aktiviert — Abonnement bestätigt`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #071423; margin-top: 0;">Abonnement aktiviert</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hallo ${displayName}, Ihr <strong>KlarGehalt ${tierLabel}</strong>-Abonnement für
            <strong>${companyName}</strong> ist jetzt aktiv.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Alle Features Ihres Tarifs sind freigeschaltet. Rechnungen und Zahlungsdetails
            finden Sie jederzeit im Kundenportal.
          </p>
          <a href="https://app.klargehalt.de/dashboard"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Zum Dashboard
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen zur Abrechnung?
            <a href="mailto:billing@klargehalt.de" style="color: #2563eb;">billing@klargehalt.de</a>
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
  await getResend().emails.send({
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

export async function sendPaymentActionRequiredEmail(
  to: string,
  name: string,
  companyName: string,
  hostedInvoiceUrl: string
): Promise<void> {
  const displayName = name || 'dort';
  await getResend().emails.send({
    from: FROM_SUPPORT,
    to,
    subject: 'Zahlung bestätigen — 3D-Secure-Authentifizierung erforderlich',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #d97706; margin-top: 0;">Zahlung bestätigen erforderlich</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hallo ${displayName}, Ihre Bank verlangt eine zusätzliche Bestätigung
            (3D Secure) für die letzte Zahlung von <strong>${companyName}</strong>.
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Ohne Bestätigung wird die Zahlung in den nächsten Tagen fehlschlagen
            und Ihr Zugang eingeschränkt.
          </p>
          <a href="${hostedInvoiceUrl}"
             style="display: inline-block; background: #d97706; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Zahlung jetzt bestätigen
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen zur Abrechnung?
            <a href="mailto:billing@klargehalt.de" style="color: #2563eb;">billing@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Compliance Workflow Notifications
// ---------------------------------------------------------------------------

export async function sendAssessmentSubmittedToLawyer(
  lawyerEmail: string,
  lawyerName: string,
  companyName: string,
  assessmentTitle: string,
  assessmentUrl: string,
): Promise<void> {
  const displayName = lawyerName || 'dort';
  await getResend().emails.send({
    from: FROM_NOREPLY,
    to: lawyerEmail,
    subject: `Neue Compliance-Prüfung eingereicht — ${assessmentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
          <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Anwaltsprüfung</p>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #071423; margin-top: 0;">Neue Prüfung eingereicht</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hallo ${displayName}, <strong>${companyName}</strong> hat eine Compliance-Prüfung zur
            anwaltlichen Begutachtung eingereicht.
          </p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Prüfung</p>
            <p style="margin: 6px 0 0; font-size: 16px; font-weight: 600; color: #0f172a;">${assessmentTitle}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Unternehmen: ${companyName}</p>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            Bitte prüfen Sie die eingereichten Unterlagen und erteilen Sie entweder eine Freigabe
            oder fordern Sie Korrekturen an.
          </p>
          <a href="${assessmentUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Prüfung öffnen
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen?
            <a href="mailto:support@klargehalt.de" style="color: #2563eb;">support@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendChangesRequestedToHR(
  hrEmail: string,
  hrName: string,
  assessmentTitle: string,
  lawyerNote: string,
  assessmentUrl: string,
): Promise<void> {
  const displayName = hrName || 'dort';
  await getResend().emails.send({
    from: FROM_NOREPLY,
    to: hrEmail,
    subject: `Korrekturen erforderlich — ${assessmentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
          <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Compliance-Prüfung</p>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #b45309; margin-top: 0;">Korrekturen angefordert</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hallo ${displayName}, der Anwalt hat für Ihre Compliance-Prüfung
            <strong>${assessmentTitle}</strong> Korrekturen angefordert.
          </p>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Hinweis vom Anwalt</p>
            <p style="margin: 8px 0 0; font-size: 15px; color: #1c1917; line-height: 1.6;">${lawyerNote}</p>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            Bitte nehmen Sie die angeforderten Änderungen vor und reichen Sie die Prüfung erneut ein.
          </p>
          <a href="${assessmentUrl}"
             style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Prüfung bearbeiten
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen?
            <a href="mailto:support@klargehalt.de" style="color: #2563eb;">support@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendAssessmentValidatedToHR(
  hrEmail: string,
  hrName: string,
  assessmentTitle: string,
  assessmentUrl: string,
): Promise<void> {
  const displayName = hrName || 'dort';
  await getResend().emails.send({
    from: FROM_NOREPLY,
    to: hrEmail,
    subject: `Prüfung freigegeben — ${assessmentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
          <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Compliance-Prüfung</p>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #059669; margin-top: 0;">Prüfung freigegeben</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hallo ${displayName}, der Anwalt hat Ihre Compliance-Prüfung
            <strong>${assessmentTitle}</strong> freigegeben.
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; font-size: 28px;">✓</p>
            <p style="margin: 8px 0 0; font-size: 15px; font-weight: 600; color: #065f46;">Freigegeben</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #047857;">${assessmentTitle}</p>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            Im nächsten Schritt kann der Anwalt ein rechtsgültiges Zertifikat ausstellen.
            Sie werden benachrichtigt, sobald das Zertifikat verfügbar ist.
          </p>
          <a href="${assessmentUrl}"
             style="display: inline-block; background: #059669; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Prüfung ansehen
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen?
            <a href="mailto:support@klargehalt.de" style="color: #2563eb;">support@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Sends login credentials to an invited employee.
 * Same rationale as sendMemberInviteEmail — never return credentials in JSON.
 */
export async function sendEmployeeInviteEmail(
  to: string,
  firstName: string,
  companyName: string,
  tempPassword: string | null,
): Promise<void> {
  const credentialsBlock = tempPassword
    ? `
      <p style="color: #475569; line-height: 1.6;">
        Sie können sich mit dieser E-Mail-Adresse und dem folgenden temporären Passwort anmelden:
      </p>
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 14px; color: #0f172a; word-break: break-all;">
        ${tempPassword}
      </div>
      <p style="color: #b91c1c; font-size: 13px; margin: 0 0 16px;">
        Bitte ändern Sie das Passwort sofort nach dem ersten Login.
      </p>
    `
    : `
      <p style="color: #475569; line-height: 1.6;">
        Ihr bestehender Account wurde mit Ihrem Mitarbeiter-Profil verknüpft. Melden Sie sich
        wie gewohnt an — Ihre Zugangsdaten haben sich nicht geändert.
      </p>
    `;
  await getResend().emails.send({
    from: FROM_NOREPLY,
    to,
    subject: `Ihr KlarGehalt-Mitarbeiterzugang für ${companyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #071423; margin-top: 0;">Hallo ${firstName || 'dort'}</h2>
          <p style="color: #475569; line-height: 1.6;">
            <strong>${companyName}</strong> hat einen Mitarbeiterzugang für Sie eingerichtet.
            Über das Portal können Sie unter anderem Ihre eigenen Gehaltsdaten einsehen.
          </p>
          ${credentialsBlock}
          <a href="https://app.klargehalt.de/sign-in"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Jetzt anmelden
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen? <a href="mailto:support@klargehalt.de" style="color: #2563eb;">support@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Sends invite credentials to a newly invited team member.
 * Replaces the previous flow that returned tempPassword in the API response —
 * credentials must reach the inviteee out-of-band via email, never sit in the
 * inviter's HTTPS response body where DevTools / proxies / browser extensions
 * could capture them.
 */
export async function sendMemberInviteEmail(
  to: string,
  role: 'admin' | 'hr_manager',
  companyName: string,
  tempPassword: string | null,
): Promise<void> {
  const roleLabel = role === 'admin' ? 'Administrator' : 'HR-Manager';
  const credentialsBlock = tempPassword
    ? `
      <p style="color: #475569; line-height: 1.6;">
        Sie können sich mit dieser E-Mail-Adresse und dem folgenden temporären Passwort anmelden:
      </p>
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 14px; color: #0f172a; word-break: break-all;">
        ${tempPassword}
      </div>
      <p style="color: #b91c1c; font-size: 13px; margin: 0 0 16px;">
        Bitte ändern Sie das Passwort sofort nach dem ersten Login.
      </p>
    `
    : `
      <p style="color: #475569; line-height: 1.6;">
        Ihr bestehender KlarGehalt-Account wurde zur Organisation hinzugefügt. Melden Sie sich
        wie gewohnt an — Ihre Zugangsdaten haben sich nicht geändert.
      </p>
    `;
  await getResend().emails.send({
    from: FROM_NOREPLY,
    to,
    subject: `Sie wurden zu ${companyName} bei KlarGehalt eingeladen`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #071423; margin-top: 0;">Einladung zu ${companyName}</h2>
          <p style="color: #475569; line-height: 1.6;">
            Sie wurden als <strong>${roleLabel}</strong> zur Organisation
            <strong>${companyName}</strong> eingeladen.
          </p>
          ${credentialsBlock}
          <a href="https://app.klargehalt.de/sign-in"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
            Jetzt anmelden
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen? <a href="mailto:support@klargehalt.de" style="color: #2563eb;">support@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendCertificateIssuedToHR(
  hrEmail: string,
  hrName: string,
  companyName: string,
  assessmentTitle: string,
  validUntil: string,
  assessmentUrl: string,
): Promise<void> {
  const displayName = hrName || 'dort';
  const validUntilFormatted = new Date(validUntil).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  await getResend().emails.send({
    from: FROM_NOREPLY,
    to: hrEmail,
    subject: `Zertifikat ausgestellt — ${assessmentTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
          <p style="color: #94a3b8; margin: 6px 0 0; font-size: 13px;">Compliance-Zertifikat</p>
        </div>
        <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <h2 style="color: #065f46; margin-top: 0;">Ihr Zertifikat ist ausgestellt</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hallo ${displayName}, für <strong>${companyName}</strong> wurde ein
            Compliance-Zertifikat ausgestellt.
          </p>

          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #6ee7b7; border-radius: 12px; padding: 28px; margin: 28px 0; text-align: center;">
            <div style="display: inline-block; background: #065f46; color: white; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px;">
              Von externem Rechtsberater geprüft
            </div>
            <h3 style="color: #065f46; margin: 0 0 8px; font-size: 18px;">${assessmentTitle}</h3>
            <p style="color: #047857; margin: 0 0 20px; font-size: 14px;">${companyName}</p>
            <div style="background: white; border-radius: 8px; padding: 16px; display: inline-block; min-width: 200px;">
              <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">Gültig bis</p>
              <p style="margin: 6px 0 0; font-size: 22px; font-weight: 700; color: #065f46;">${validUntilFormatted}</p>
            </div>
          </div>

          <p style="color: #475569; line-height: 1.6;">
            Das Zertifikat dokumentiert, dass Ihre Entgeltstrukturen von einem unabhängigen externen
            Rechtsberater geprüft wurden. Es ist als Nachweis im Rahmen der EU-Entgelttransparenzrichtlinie
            (2023/970) verwendbar.
          </p>
          <a href="${assessmentUrl}"
             style="display: inline-block; background: #065f46; color: white; padding: 14px 28px;
                    border-radius: 6px; text-decoration: none; font-weight: 700; margin-top: 8px; font-size: 15px;">
            Zertifikat abrufen
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            Fragen?
            <a href="mailto:support@klargehalt.de" style="color: #2563eb;">support@klargehalt.de</a>
          </p>
        </div>
      </div>
    `,
  });
}

/** Minimal HTML escape for user-controlled values (e.g. companyName) in email bodies. */
const escHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const accountEmailShell = (heading: string, accent: string, body: string): string => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
    <div style="background: #071423; padding: 32px 40px; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 24px;">KlarGehalt</h1>
    </div>
    <div style="padding: 40px; background: #f8fafc; border-radius: 0 0 8px 8px;">
      <h2 style="color: ${accent}; margin-top: 0;">${heading}</h2>
      ${body}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        Fragen? <a href="mailto:support@klargehalt.de" style="color: #2563eb;">support@klargehalt.de</a>
      </p>
    </div>
  </div>
`;

/**
 * Konto zur Löschung vorgemerkt (Owner). Soft-lock: 30-Tage-Frist, reaktivierbar.
 * Wording strikt nach law.md §7 — keine Heilsversprechen.
 */
export async function sendAccountDeletionScheduledEmail(
  to: string,
  companyName: string,
  scheduledForFormatted: string,
): Promise<void> {
  await getResend().emails.send({
    from: FROM_SUPPORT,
    to,
    subject: `Ihr KlarGehalt-Konto wird gelöscht — Reaktivierung bis ${scheduledForFormatted}`,
    html: accountEmailShell('Konto zur Löschung vorgemerkt', '#b45309', `
      <p style="color: #475569; line-height: 1.6;">
        Die Löschung des Kontos <strong>${escHtml(companyName)}</strong> wurde vorgemerkt.
        Das Abonnement wird zum Ende der laufenden Abrechnungsperiode beendet.
      </p>
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e; line-height: 1.6;">
          Endgültige Löschung am <strong>${scheduledForFormatted}</strong>.
          Bis dahin können Sie das Konto jederzeit reaktivieren — danach ist
          die Löschung nicht umkehrbar.
        </p>
      </div>
      <p style="color: #475569; line-height: 1.6;">
        Aus gesetzlichen Aufbewahrungsgründen (EU-Entgelttransparenzrichtlinie
        2023/970, DSGVO Art. 17 Abs. 3 lit. b) bleibt die
        Compliance-Dokumentation — Begründungs-Trail und Audit-Protokoll — in
        anonymisierter Form erhalten. Personenbezogene Daten Ihrer
        Mitarbeitenden werden entfernt bzw. pseudonymisiert.
      </p>
      <a href="https://app.klargehalt.de/konto-gesperrt"
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
        Konto reaktivieren
      </a>
      <p style="color: #94a3b8; font-size: 13px; margin: 20px 0 0;">
        Sie haben diese Löschung nicht veranlasst? Reaktivieren Sie das Konto
        umgehend und ändern Sie Ihr Passwort.
      </p>
    `),
  });
}

/** Konto reaktiviert (innerhalb der 30-Tage-Frist). */
export async function sendAccountRestoredEmail(to: string, companyName: string): Promise<void> {
  await getResend().emails.send({
    from: FROM_SUPPORT,
    to,
    subject: 'Ihr KlarGehalt-Konto wurde reaktiviert',
    html: accountEmailShell('Konto reaktiviert', '#065f46', `
      <p style="color: #475569; line-height: 1.6;">
        Die vorgemerkte Löschung des Kontos <strong>${escHtml(companyName)}</strong>
        wurde aufgehoben. Das Konto ist wieder vollständig nutzbar.
      </p>
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #065f46; line-height: 1.6;">
          Bitte prüfen Sie in der Abrechnung, ob ein aktives Abonnement
          besteht — andernfalls schließen Sie es erneut ab, um den vollen
          Funktionsumfang zu behalten.
        </p>
      </div>
      <a href="https://app.klargehalt.de/abrechnung"
         style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px;
                border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 8px;">
        Zur Abrechnung
      </a>
    `),
  });
}

/** Endgültige Löschung durchgeführt (Cron, nach Ablauf der Frist). */
export async function sendAccountAnonymizedEmail(to: string, companyName: string): Promise<void> {
  await getResend().emails.send({
    from: FROM_SUPPORT,
    to,
    subject: 'Ihr KlarGehalt-Konto wurde endgültig gelöscht',
    html: accountEmailShell('Konto endgültig gelöscht', '#071423', `
      <p style="color: #475569; line-height: 1.6;">
        Das Konto <strong>${escHtml(companyName)}</strong> wurde endgültig gelöscht.
        Personenbezogene Daten wurden entfernt bzw. pseudonymisiert; ein Zugang
        besteht nicht mehr.
      </p>
      <p style="color: #475569; line-height: 1.6;">
        Aus gesetzlichen Aufbewahrungsgründen (EU-Entgelttransparenzrichtlinie
        2023/970, DSGVO Art. 17 Abs. 3 lit. b) bleibt die
        Compliance-Dokumentation in anonymisierter Form gespeichert. In
        Backups können Restdaten für bis zu 7 Tage fortbestehen, bevor sie
        endgültig entfallen.
      </p>
    `),
  });
}
