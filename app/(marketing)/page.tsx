'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight, Scale, FileCheck, BarChart3, Shield, Users, BookOpen } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getAppUrl, getMarketingUrl } from '@/utils/url';

const teasers = [
    {
        icon: BarChart3,
        title: 'Gehaltsstrukturen & Pay-Gap',
        desc: 'Job-Profile, Gehaltsbaender und automatische Median-Berechnung nach Geschlecht.',
        href: '/funktionen',
        linkText: 'Alle Funktionen',
    },
    {
        icon: Shield,
        title: 'Sicherheit & Datenschutz',
        desc: 'AES-256, Mandantentrennung, EU-Hosting. Gehaltsdaten verdienen besonderen Schutz.',
        href: '/sicherheit',
        linkText: 'Sicherheitskonzept',
    },
    {
        icon: Scale,
        title: 'EU-Richtlinie 2023/970',
        desc: 'Was muessen Unternehmen tun? Fristen, Pflichten und Bussgelder einfach erklaert.',
        href: '/eu-richtlinie',
        linkText: 'Richtlinie verstehen',
    },
];

export default function HomePage() {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.replace('/dashboard');
        }
    }, [isLoaded, isSignedIn, router]);

    if (!isLoaded) return null;
    if (isSignedIn) return null;

    return (
        <>
            {/* Hero */}
            <section className="relative overflow-hidden pt-[72px] bg-white">
                <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-40 pb-20 lg:pb-28">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                        <div className="lg:col-span-7">
                            <div className="mb-8">
                                <Image
                                    src="/brandname.svg"
                                    alt="KlarGehalt"
                                    width={500}
                                    height={65}
                                    priority
                                    className="h-12 sm:h-14 lg:h-16 w-auto"
                                />
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-[#1E293B] tracking-tight leading-[1.1] mb-6">
                                Gehaltsdaten ordnen,
                                <br />
                                <span className="text-slate-400">bevor es die Behoerde tut.</span>
                            </h1>

                            <p className="text-base lg:text-lg text-slate-500 leading-relaxed max-w-[50ch] mb-10">
                                Ab Juni 2026 muessen Unternehmen ab 100 Mitarbeitern Gehaltsstrukturen offenlegen.
                                KlarGehalt macht das einfach — Strukturen erfassen, Luecken erkennen,
                                Berichte generieren.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 mb-12">
                                <Link href={getMarketingUrl('/kontakt')}>
                                    <Button className="group bg-[#1E293B] text-white hover:bg-[#0F172A] h-13 px-8 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer w-full sm:w-auto">
                                        Kostenlose Demo starten
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                                <Link href={getMarketingUrl('/funktionen')}>
                                    <Button
                                        variant="outline"
                                        className="h-13 px-8 rounded-lg text-sm font-semibold border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer w-full sm:w-auto"
                                    >
                                        Was kann KlarGehalt?
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2">
                                    <Scale className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-400">EU-Richtlinie 2023/970</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FileCheck className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-400">DSGVO-konform</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-medium text-slate-400">Hosting in Frankfurt</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 lg:mt-8">
                            <div className="bg-[#1E293B] rounded-2xl p-8 lg:p-10 text-white">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em] mb-6">
                                    EU-Entgelttransparenzrichtlinie
                                </p>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-1">Juni 2026</p>
                                        <p className="text-sm text-slate-400">Umsetzungsfrist fuer Unternehmen ab 100 MA</p>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <ul className="space-y-3">
                                        {[
                                            'Gehaltsstrukturen muessen offengelegt werden',
                                            'Gender-Pay-Gap Berichte werden Pflicht',
                                            'Mitarbeiter erhalten Auskunftsrecht',
                                            'Bussgelder bei Nichterfuellung',
                                        ].map((item) => (
                                            <li key={item} className="flex items-start gap-3">
                                                <span className="w-1 h-1 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                                                <span className="text-sm text-slate-300">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href={getMarketingUrl('/eu-richtlinie')} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer">
                                        Mehr zur Richtlinie <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </section>

            {/* Teaser Grid */}
            <section className="py-24 lg:py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="max-w-2xl mb-14">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight mb-4">
                            Eine Plattform. Alles drin.
                        </h2>
                        <p className="text-base text-slate-500 leading-relaxed">
                            Von der Gehaltsstruktur bis zum fertigen Bericht — KlarGehalt deckt den gesamten Compliance-Prozess ab.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {teasers.map((t) => (
                            <Link
                                key={t.href}
                                href={getMarketingUrl(t.href)}
                                className="group bg-white rounded-2xl border border-slate-200 p-8 hover:border-slate-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
                            >
                                <t.icon className="w-6 h-6 text-slate-400 mb-5 group-hover:text-[#1E293B] transition-colors" />
                                <h3 className="text-lg font-bold text-[#1E293B] tracking-tight mb-2">{t.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6">{t.desc}</p>
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1E293B] group-hover:gap-2.5 transition-all">
                                    {t.linkText} <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof / Why Section */}
            <section className="py-24 lg:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-5 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight mb-6">
                                Warum jetzt handeln?
                            </h2>
                            <div className="space-y-6">
                                {[
                                    {
                                        q: 'Die Frist laeuft.',
                                        a: 'Bis Juni 2026 muss die EU-Richtlinie in nationales Recht umgesetzt sein. Unternehmen ab 100 Mitarbeitern muessen dann berichten.',
                                    },
                                    {
                                        q: 'Rueckwirkende Daten werden noetig.',
                                        a: 'Die Richtlinie verlangt historische Vergleiche. Je frueher Sie Daten erfassen, desto besser stehen Sie da.',
                                    },
                                    {
                                        q: 'Mitarbeiter werden fragen.',
                                        a: 'Das individuelle Auskunftsrecht kommt. Wer keine Struktur hat, muss improvisieren — und riskiert Klagen.',
                                    },
                                ].map((item) => (
                                    <div key={item.q}>
                                        <h3 className="text-base font-bold text-[#1E293B] mb-1">{item.q}</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-8 lg:p-10">
                            <div className="flex items-center gap-3 mb-6">
                                <Users className="w-5 h-5 text-slate-400" />
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em]">Fuer wen ist KlarGehalt?</p>
                            </div>
                            <div className="space-y-5">
                                {[
                                    { role: 'HR-Leitung', text: 'Gehaltsbaender pflegen, Pay-Gap analysieren, Berichte generieren.' },
                                    { role: 'Geschaeftsfuehrung', text: 'Compliance sicherstellen, Bussgelder vermeiden, Ueberblick behalten.' },
                                    { role: 'Betriebsrat', text: 'Transparente Datengrundlage fuer Verhandlungen und Auskunftsanfragen.' },
                                    { role: 'Mitarbeiter', text: 'Anonymisierte Einblicke in die eigene Gehaltsgruppe. DSGVO-konform.' },
                                ].map((item) => (
                                    <div key={item.role} className="flex gap-4">
                                        <span className="text-xs font-bold text-[#1E293B] w-28 flex-shrink-0 pt-0.5">{item.role}</span>
                                        <p className="text-sm text-slate-500">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 lg:py-24 bg-[#1E293B]">
                <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                        Bereit, Klarheit zu schaffen?
                    </h2>
                    <p className="text-sm text-slate-400 mb-8 max-w-[45ch] mx-auto">
                        In 20 Minuten zeigen wir Ihnen, wie KlarGehalt fuer Ihr Unternehmen funktioniert. Unverbindlich.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href={getMarketingUrl('/kontakt')}>
                            <Button className="bg-white text-[#1E293B] hover:bg-slate-100 h-12 px-8 rounded-lg text-sm font-semibold cursor-pointer">
                                Demo anfragen <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Link href={getMarketingUrl('/preise')}>
                            <Button variant="outline" className="h-12 px-8 rounded-lg text-sm font-semibold border-white/20 text-white hover:bg-white/10 cursor-pointer">
                                Preise ansehen
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
