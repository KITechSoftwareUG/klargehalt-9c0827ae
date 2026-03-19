'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function KontaktPage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <p className="text-xs font-mono font-bold text-slate-400 mb-4">KONTAKT</p>
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-[#1E293B] tracking-tight leading-[1.1] mb-6">
                            Sprechen wir drueber.
                        </h1>
                        <p className="text-base lg:text-lg text-slate-500 leading-relaxed max-w-[55ch]">
                            Ob Demo, Beratung oder technische Fragen — wir sind fuer Sie da.
                            Melden Sie sich und wir antworten innerhalb eines Werktags.
                        </p>
                    </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </section>

            {/* Contact Grid */}
            <section className="py-20 lg:py-28">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20">
                        {/* Left — Contact Info */}
                        <div className="lg:col-span-5 space-y-10">
                            <div>
                                <h2 className="text-xl font-extrabold text-[#1E293B] tracking-tight mb-6">
                                    So erreichen Sie uns.
                                </h2>
                                <div className="space-y-5">
                                    <div className="flex gap-4">
                                        <Mail className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-[#1E293B]">kontakt@klargehalt.de</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Fuer allgemeine Anfragen und Demos</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Phone className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-[#1E293B]">+49 (0) 30 847 291 03</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Mo-Fr, 9:00-17:00 Uhr</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-[#1E293B]">Berlin, Deutschland</p>
                                            <p className="text-xs text-slate-400 mt-0.5">KITech Software UG</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-[#1E293B]">Antwort innerhalb von 24h</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Meistens deutlich schneller</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* What to expect */}
                            <div className="bg-slate-50 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-[#1E293B] mb-4">Was passiert nach Ihrer Anfrage?</h3>
                                <div className="space-y-4">
                                    {[
                                        { step: '1', text: 'Wir melden uns innerhalb eines Werktags per E-Mail.' },
                                        { step: '2', text: 'Gemeinsam finden wir einen Termin fuer eine 20-Minuten Demo.' },
                                        { step: '3', text: 'Sie sehen KlarGehalt live — mit Ihren Fragen und Anforderungen.' },
                                        { step: '4', text: 'Wenn es passt, richten wir Ihren Testzugang ein.' },
                                    ].map((s) => (
                                        <div key={s.step} className="flex gap-3">
                                            <span className="text-xs font-bold text-slate-300 w-4 flex-shrink-0">{s.step}</span>
                                            <p className="text-sm text-slate-500">{s.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right — Form */}
                        <div className="lg:col-span-7">
                            <div className="bg-white rounded-2xl border border-slate-200 p-7 lg:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                                <h3 className="text-lg font-bold text-[#1E293B] tracking-tight mb-1">Demo anfragen</h3>
                                <p className="text-xs text-slate-400 mb-7">Alle Felder mit * sind Pflichtfelder.</p>

                                <form className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField label="Vorname *" id="fn" placeholder="Max" />
                                        <FormField label="Nachname *" id="ln" placeholder="Mustermann" />
                                    </div>
                                    <FormField label="Geschaeftliche E-Mail *" id="email" type="email" placeholder="m.mustermann@firma.de" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField label="Unternehmen *" id="co" placeholder="Unternehmen GmbH" />
                                        <div>
                                            <label htmlFor="size" className="block text-xs font-medium text-slate-600 mb-1.5">Mitarbeiteranzahl *</label>
                                            <select id="size" className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E293B]/10 focus:border-[#1E293B]/30 transition-all cursor-pointer">
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
                                        <label htmlFor="interest" className="block text-xs font-medium text-slate-600 mb-1.5">Wofuer interessieren Sie sich?</label>
                                        <select id="interest" className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E293B]/10 focus:border-[#1E293B]/30 transition-all cursor-pointer">
                                            <option value="">Bitte waehlen</option>
                                            <option value="demo">Live-Demo</option>
                                            <option value="beratung">Compliance-Beratung</option>
                                            <option value="preise">Individuelle Preisanfrage</option>
                                            <option value="technisch">Technische Fragen</option>
                                            <option value="sonstiges">Sonstiges</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="msg" className="block text-xs font-medium text-slate-600 mb-1.5">Nachricht (optional)</label>
                                        <textarea
                                            id="msg"
                                            rows={4}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-[#1E293B] placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E293B]/10 focus:border-[#1E293B]/30 transition-all resize-none"
                                            placeholder="Was moechten Sie wissen? Welche Herausforderung haben Sie aktuell?"
                                        />
                                    </div>
                                    <Button className="w-full h-12 bg-[#1E293B] text-white hover:bg-[#0F172A] rounded-lg text-sm font-semibold shadow-sm group cursor-pointer">
                                        Anfrage absenden
                                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </Button>
                                    <p className="text-[10px] text-slate-300 text-center">
                                        Mit dem Absenden stimmen Sie unserer Datenschutzerklaerung zu.
                                        Wir geben Ihre Daten nicht an Dritte weiter.
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

function FormField({ label, id, type = 'text', placeholder }: { label: string; id: string; type?: string; placeholder: string }) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
            <input
                type={type}
                id={id}
                className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-[#1E293B] placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E293B]/10 focus:border-[#1E293B]/30 transition-all"
                placeholder={placeholder}
            />
        </div>
    );
}
