import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

const schema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    company: z.string().min(1),
    size: z.string().min(1),
    role: z.string().optional(),
    interest: z.string().optional(),
    message: z.string().optional(),
});

export async function POST(request: Request) {
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

    try {
        await resend.emails.send({
            from: 'KlarGehalt Website <noreply@klargehalt.de>',
            to: 'info@klargehalt.de',
            replyTo: email,
            subject: `Demo-Anfrage von ${firstName} ${lastName} (${company})`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
                    <div style="background: #071423; padding: 28px 32px; border-radius: 8px 8px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 20px;">Neue Kontaktanfrage</h1>
                    </div>
                    <div style="padding: 32px; background: #f8fafc; border-radius: 0 0 8px 8px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 6px 0; font-weight: 600; color: #475569; width: 140px;">Name</td><td style="padding: 6px 0; color: #071423;">${firstName} ${lastName}</td></tr>
                            <tr><td style="padding: 6px 0; font-weight: 600; color: #475569;">E-Mail</td><td style="padding: 6px 0; color: #071423;"><a href="mailto:${email}">${email}</a></td></tr>
                            <tr><td style="padding: 6px 0; font-weight: 600; color: #475569;">Unternehmen</td><td style="padding: 6px 0; color: #071423;">${company}</td></tr>
                            <tr><td style="padding: 6px 0; font-weight: 600; color: #475569;">Mitarbeiter</td><td style="padding: 6px 0; color: #071423;">${size}</td></tr>
                            ${role ? `<tr><td style="padding: 6px 0; font-weight: 600; color: #475569;">Rolle</td><td style="padding: 6px 0; color: #071423;">${role}</td></tr>` : ''}
                            ${interest ? `<tr><td style="padding: 6px 0; font-weight: 600; color: #475569;">Interesse</td><td style="padding: 6px 0; color: #071423;">${interest}</td></tr>` : ''}
                        </table>
                        ${message ? `<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"><p style="color: #475569; line-height: 1.6; white-space: pre-wrap;">${message}</p>` : ''}
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
