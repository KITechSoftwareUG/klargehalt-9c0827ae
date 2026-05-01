'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Phone, MapPin, Clock, CheckCircle2 } from 'lucide-react';

const schema = z.object({
    firstName: z.string().min(1, 'Pflichtfeld'),
    lastName: z.string().min(1, 'Pflichtfeld'),
    email: z.string().email('Ungültige E-Mail-Adresse'),
    company: z.string().min(1, 'Pflichtfeld'),
    size: z.string().min(1, 'Bitte wählen'),
    role: z.string().optional(),
    interest: z.string().optional(),
    message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ContactForm() {
    const [submitted, setSubmitted] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    async function onSubmit(data: FormData) {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            toast.error(body.error ?? 'Fehler beim Senden. Bitte versuchen Sie es erneut.');
            return;
        }

        setSubmitted(true);
    }

    return (
        <section className="py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20">
                    {/* Left — Contact Info */}
                    <div className="lg:col-span-5 space-y-10">
                        <div>
                            <h2 className="text-xl font-extrabold text-[#071423] tracking-tight mb-6">
                                So erreichen Sie uns.
                            </h2>
                            <div className="space-y-5">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--ep-teal-light)] flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-[var(--ep-teal-dark)]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#071423]">info@klargehalt.de</p>
                                        <p className="text-xs text-[var(--ep-gray-3)] mt-0.5">Für allgemeine Anfragen und Demos</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--ep-purple-light)] flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5 text-[var(--ep-purple-dark)]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#071423]">+49 (0) 30 847 291 03</p>
                                        <p className="text-xs text-[var(--ep-gray-3)] mt-0.5">Mo-Fr, 9:00-17:00 Uhr</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--ep-yellow-light)] flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-[var(--ep-yellow-dark)]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#071423]">Berlin, Deutschland</p>
                                        <p className="text-xs text-[var(--ep-gray-3)] mt-0.5">KITech Software UG</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--ep-gray-1)] flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-[var(--ep-gray-4)]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#071423]">Antwort innerhalb von 24h</p>
                                        <p className="text-xs text-[var(--ep-gray-3)] mt-0.5">Meistens deutlich schneller</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--ep-gray-1)] rounded-xl p-6 border border-[var(--ep-gray-2)]">
                            <h3 className="text-sm font-bold text-[#071423] mb-4">Was passiert nach Ihrer Anfrage?</h3>
                            <div className="space-y-4">
                                {[
                                    { step: '1', text: 'Wir melden uns innerhalb eines Werktags per E-Mail.' },
                                    { step: '2', text: 'Gemeinsam finden wir einen Termin für eine 20-Minuten Demo.' },
                                    { step: '3', text: 'Sie sehen KlarGehalt live — mit Ihren Fragen und Anforderungen.' },
                                    { step: '4', text: 'Wenn es passt, richten wir Ihren Testzugang ein.' },
                                ].map((s) => (
                                    <div key={s.step} className="flex gap-3">
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--ep-teal-light)] text-xs font-bold text-[var(--ep-teal-dark)] flex-shrink-0">{s.step}</span>
                                        <p className="text-sm text-[var(--ep-gray-4)]">{s.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right — Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-2xl border border-[var(--ep-gray-2)] p-7 lg:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                            {submitted ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-[var(--ep-teal-light)] flex items-center justify-center">
                                        <CheckCircle2 className="w-7 h-7 text-[var(--ep-teal-dark)]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#071423]">Anfrage gesendet!</h3>
                                    <p className="text-sm text-[var(--ep-gray-3)] max-w-[38ch]">
                                        Vielen Dank. Wir melden uns innerhalb eines Werktags bei Ihnen.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-[#071423] tracking-tight mb-1">Demo anfragen</h3>
                                    <p className="text-xs text-[var(--ep-gray-3)] mb-7">Alle Felder mit * sind Pflichtfelder.</p>

                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField label="Vorname *" id="firstName" placeholder="Max" error={errors.firstName?.message} {...register('firstName')} />
                                            <FormField label="Nachname *" id="lastName" placeholder="Mustermann" error={errors.lastName?.message} {...register('lastName')} />
                                        </div>
                                        <FormField label="Geschäftliche E-Mail *" id="email" type="email" placeholder="m.mustermann@firma.de" error={errors.email?.message} {...register('email')} />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField label="Unternehmen *" id="company" placeholder="Unternehmen GmbH" error={errors.company?.message} {...register('company')} />
                                            <div>
                                                <label htmlFor="size" className="block text-xs font-medium text-[var(--ep-gray-4)] mb-1.5">Mitarbeiteranzahl *</label>
                                                <select
                                                    id="size"
                                                    {...register('size')}
                                                    className="w-full h-11 px-3.5 rounded-lg border border-[var(--ep-gray-2)] bg-white text-[#071423] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ep-purple)]/20 focus:border-[var(--ep-purple)]/40 transition-all cursor-pointer"
                                                >
                                                    <option value="">Bitte wählen</option>
                                                    <option value="1-50">1 - 50</option>
                                                    <option value="51-100">51 - 100</option>
                                                    <option value="101-250">101 - 250</option>
                                                    <option value="251-1000">251 - 1.000</option>
                                                    <option value="1000+">1.000+</option>
                                                </select>
                                                {errors.size && <p className="text-xs text-red-500 mt-1">{errors.size.message}</p>}
                                            </div>
                                        </div>
                                        <FormField label="Ihre Rolle" id="role" placeholder="z.B. HR-Leitung, Geschäftsführung" {...register('role')} />
                                        <div>
                                            <label htmlFor="interest" className="block text-xs font-medium text-[var(--ep-gray-4)] mb-1.5">Wofür interessieren Sie sich?</label>
                                            <select
                                                id="interest"
                                                {...register('interest')}
                                                className="w-full h-11 px-3.5 rounded-lg border border-[var(--ep-gray-2)] bg-white text-[#071423] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ep-purple)]/20 focus:border-[var(--ep-purple)]/40 transition-all cursor-pointer"
                                            >
                                                <option value="">Bitte wählen</option>
                                                <option value="Live-Demo">Live-Demo</option>
                                                <option value="Compliance-Beratung">Compliance-Beratung</option>
                                                <option value="Individuelle Preisanfrage">Individuelle Preisanfrage</option>
                                                <option value="Technische Fragen">Technische Fragen</option>
                                                <option value="Sonstiges">Sonstiges</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="message" className="block text-xs font-medium text-[var(--ep-gray-4)] mb-1.5">Nachricht (optional)</label>
                                            <textarea
                                                id="message"
                                                rows={4}
                                                {...register('message')}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--ep-gray-2)] bg-white text-[#071423] placeholder:text-[var(--ep-gray-3)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ep-purple)]/20 focus:border-[var(--ep-purple)]/40 transition-all resize-none"
                                                placeholder="Was möchten Sie wissen? Welche Herausforderung haben Sie aktuell?"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full h-12 bg-[#071423] text-white hover:bg-[#0d1f33] rounded-lg text-sm font-semibold shadow-sm group cursor-pointer disabled:opacity-60"
                                        >
                                            {isSubmitting ? 'Wird gesendet…' : 'Anfrage absenden'}
                                            {!isSubmitting && <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />}
                                        </Button>
                                        <p className="text-[10px] text-[var(--ep-gray-3)] text-center">
                                            Mit dem Absenden stimmen Sie unserer Datenschutzerklärung zu.
                                            Wir geben Ihre Daten nicht an Dritte weiter.
                                        </p>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    error?: string;
}

function FormField({ label, id, type = 'text', placeholder, error, ...rest }: FormFieldProps) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-medium text-[var(--ep-gray-4)] mb-1.5">{label}</label>
            <input
                type={type}
                id={id}
                placeholder={placeholder}
                className="w-full h-11 px-3.5 rounded-lg border border-[var(--ep-gray-2)] bg-white text-[#071423] placeholder:text-[var(--ep-gray-3)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ep-purple)]/20 focus:border-[var(--ep-purple)]/40 transition-all"
                {...rest}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
