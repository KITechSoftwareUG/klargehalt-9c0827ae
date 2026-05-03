import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/rate-limit';

const schema = z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email().max(254),
    company: z.string().min(1).max(200),
    size: z.string().min(1).max(50),
    role: z.string().max(100).optional(),
    interest: z.string().max(200).optional(),
    message: z.string().max(5000).optional(),
});

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-real-ip')
      ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? 'unknown';
    const allowed = await checkRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
    if (!allowed) {
        return NextResponse.json({ error: 'Zu viele Anfragen' }, { status: 429 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    const { firstName, lastName, email, company, size, role, interest, message } = parsed.data;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY not configured');
        return NextResponse.json({ error: 'Konfigurationsfehler' }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    const safeFirst = escapeHtml(firstName);
    const safeLast = escapeHtml(lastName);
    const safeEmail = escapeHtml(email);
    const safeCompany = escapeHtml(company);
    const safeSize = escapeHtml(size);
    const safeRole = role ? escapeHtml(role) : '';
    const safeInterest = interest ? escapeHtml(interest) : '';
    const safeMessage = message ? escapeHtml(message) : '';

    try {
        await resend.emails.send({
            from: 'KlarGehalt Website <noreply@klargehalt.de>',
            to: 'info@klargehalt.de',
            replyTo: email,
            subject: `Demo-Anfrage von ${safeFirst} ${safeLast} (${safeCompany})`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
                    <div style="background: #071423; padding: 28px 32px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 20px;">Neue Kontaktanfrage</h1>
                    </div>
                    <div style="padding: 32px; background: #f8fafc; border-radius: 0 0 8px 8px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 6px 0; font-weight: 600; color: #475569; width: 140px;">Name</td><td style="padding: 6px 0; color: #071423;">${safeFirst} ${safeLast}</td></tr>
                            <tr><td style="padding: 6px 0; font-weight: 600; color: #475569;">E-Mail</td><td style="padding: 6px 0; color: #071423;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
                            <tr><td style="padding: 6px 0; font-weight: 600; color: #475569;">Unternehmen</td><td style="padding: 6px 0; color: #071423;">${safeCompany}</td></tr>
                            <tr><td style="padding: 6px 0; font-weight: 600; color: #475569;">Mitarbeiter</td><td style="padding: 6px 0; color: #071423;">${safeSize}</td></tr>
                            ${safeRole ? `<tr><td style="padding: 6px 0; font-weight: 600; color: #475569;">Rolle</td><td style="padding: 6px 0; color: #071423;">${safeRole}</td></tr>` : ''}
                            ${safeInterest ? `<tr><td style="padding: 6px 0; font-weight: 600; color: #475569;">Interesse</td><td style="padding: 6px 0; color: #071423;">${safeInterest}</td></tr>` : ''}
                        </table>
                        ${safeMessage ? `<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"><p style="color: #475569; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>` : ''}
                    </div>
                </div>
            `,
        });
    } catch (err) {
        console.error('Resend error:', err);
        return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
