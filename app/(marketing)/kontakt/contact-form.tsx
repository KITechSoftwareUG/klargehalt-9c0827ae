'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ContactForm() {
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

                        {/* What to expect */}
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
                            <h3 className="text-lg font-bold text-[#071423] tracking-tight mb-1">Demo anfragen</h3>
                            <p className="text-xs text-[var(--ep-gray-3)] mb-7">Alle Felder mit * sind Pflichtfelder.</p>

                            <form className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField label="Vorname *" id="fn" placeholder="Max" />
                                    <FormField label="Nachname *" id="ln" placeholder="Mustermann" />
                                </div>
                                <FormField label="Geschaeftliche E-Mail *" id="email" type="email" placeholder="m.mustermann@firma.de" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField label="Unternehmen *" id="co" placeholder="Unternehmen GmbH" />
                                    <div>
                                        <label htmlFor="size" className="block text-xs font-medium text-[var(--ep-gray-4)] mb-1.5">Mitarbeiteranzahl *</label>
                                        <select id="size" className="w-full h-11 px-3.5 rounded-lg border border-[var(--ep-gray-2)] bg-white text-[#071423] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ep-purple)]/20 focus:border-[var(--ep-purple)]/40 transition-all cursor-pointer">
                                            <option value="">Bitte waehlen</option>
                                            <option value="1-50">1 - 50</option>
                                            <option value="51-100">51 - 100</option>
                                            <option value="101-250">101 - 250</option>
                                            <option value="251-1000">251 - 1.000</option>
                                            <option value="1000+">1.000+</option>
                                        </select>
                                    </div>
                                </div>
                                <FormField label="Ihre Rolle" id="role" placeholder="z.B. HR-Leitung, Geschaeftsfuehrung" />
                                <div>
                                    <label htmlFor="interest" className="block text-xs font-medium text-[var(--ep-gray-4)] mb-1.5">Wofür interessieren Sie sich?</label>
                                    <select id="interest" className="w-full h-11 px-3.5 rounded-lg border border-[var(--ep-gray-2)] bg-white text-[#071423] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ep-purple)]/20 focus:border-[var(--ep-purple)]/40 transition-all cursor-pointer">
                                        <option value="">Bitte waehlen</option>
                                        <option value="demo">Live-Demo</option>
                                        <option value="beratung">Compliance-Beratung</option>
                                        <option value="preise">Individuelle Preisanfrage</option>
                                        <option value="technisch">Technische Fragen</option>
                                        <option value="sonstiges">Sonstiges</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="msg" className="block text-xs font-medium text-[var(--ep-gray-4)] mb-1.5">Nachricht (optional)</label>
                                    <textarea
                                        id="msg"
                                        rows={4}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--ep-gray-2)] bg-white text-[#071423] placeholder:text-[var(--ep-gray-3)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ep-purple)]/20 focus:border-[var(--ep-purple)]/40 transition-all resize-none"
                                        placeholder="Was moechten Sie wissen? Welche Herausforderung haben Sie aktuell?"
                                    />
                                </div>
                                <Button className="w-full h-12 bg-[#071423] text-white hover:bg-[#0d1f33] rounded-lg text-sm font-semibold shadow-sm group cursor-pointer">
                                    Anfrage absenden
                                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                </Button>
                                <p className="text-[10px] text-[var(--ep-gray-3)] text-center">
                                    Mit dem Absenden stimmen Sie unserer Datenschutzerklaerung zu.
                                    Wir geben Ihre Daten nicht an Dritte weiter.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FormField({ label, id, type = 'text', placeholder }: { label: string; id: string; type?: string; placeholder: string }) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-medium text-[var(--ep-gray-4)] mb-1.5">{label}</label>
            <input
                type={type}
                id={id}
                className="w-full h-11 px-3.5 rounded-lg border border-[var(--ep-gray-2)] bg-white text-[#071423] placeholder:text-[var(--ep-gray-3)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ep-purple)]/20 focus:border-[var(--ep-purple)]/40 transition-all"
                placeholder={placeholder}
            />
        </div>
    );
}
