'use client';

import { ArrowLeft, Clock, Loader2, Scale } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'sign-in' | 'sign-up';

interface AuthLauncherProps {
    mode: Mode;
}

interface ModeCopy {
    title: string;
    body: string;
    cta: string;
    ctaHref: string;
    footerPrompt: string;
    footerLinkLabel: string;
    footerLinkHref: string;
}

const COPY: Record<Mode, ModeCopy> = {
    'sign-in': {
        title: 'Anmelden',
        body: 'Melden Sie sich sicher in Ihrem klargehalt-Workspace an.',
        cta: 'Sicher anmelden',
        ctaHref: '/auth/sign-in',
        footerPrompt: 'Noch kein Konto?',
        footerLinkLabel: 'Jetzt registrieren',
        footerLinkHref: '/sign-up',
    },
    'sign-up': {
        title: 'Konto erstellen',
        body: 'Starten Sie jetzt mit klargehalt — EU-konform, sicher, einfach.',
        cta: 'Jetzt registrieren',
        ctaHref: '/auth/sign-up',
        footerPrompt: 'Bereits registriert?',
        footerLinkLabel: 'Anmelden',
        footerLinkHref: '/sign-in',
    },
};

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const TARGET_DATE = new Date('2026-06-07T00:00:00');

export function AuthLauncher({ mode }: AuthLauncherProps) {
    const router = useRouter();
    const { isLoaded, isSignedIn, organizations } = useAuth();
    const copy = COPY[mode];

    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calc = () => {
            const diff = TARGET_DATE.getTime() - Date.now();
            if (diff > 0) {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60),
                });
            }
        };
        calc();
        const timer = setInterval(calc, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) {
            return;
        }
        const target = organizations.length > 0 ? '/dashboard' : '/onboarding';
        router.replace(target);
    }, [isLoaded, isSignedIn, organizations, router]);

    const alreadyAuthenticated = isLoaded && isSignedIn;

    return (
        <div className="min-h-screen flex bg-[#071423]">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:4rem_4rem]" />

                <div className="relative z-10">
                    <Link href="https://klargehalt.de" className="inline-block mb-12">
                        <Image src="/brandname.svg" alt="klargehalt" width={200} height={30} className="h-8 w-auto brightness-0 invert" />
                    </Link>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#52e0de]/10 border border-[#52e0de]/20 mb-6">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#52e0de] animate-pulse" />
                        <span className="text-xs font-semibold text-[#52e0de] uppercase tracking-wide">Frist läuft</span>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.08] mb-6">
                        EU-Entgelttransparenz-
                        <br /><span className="text-white/40">richtlinie 2023/970</span>
                    </h1>
                    <p className="text-base text-white/50 leading-relaxed max-w-[48ch] mb-10">
                        Ab dem <span className="text-white font-semibold">7. Juni 2026</span> müssen Unternehmen mit mehr als 100 Mitarbeitern Gehaltsstrukturen offenlegen.
                    </p>

                    {/* Countdown */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-[#946df7]" />
                            <span className="text-xs font-semibold text-white/30 uppercase tracking-wide">Zeit bis zur Umsetzung</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { value: timeLeft.days, label: 'Tage' },
                                { value: timeLeft.hours, label: 'Std' },
                                { value: timeLeft.minutes, label: 'Min' },
                                { value: timeLeft.seconds, label: 'Sek' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-extrabold text-white tabular-nums">
                                        {String(item.value).padStart(2, '0')}
                                    </div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-wide mt-1">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-start gap-3">
                            <Scale className="w-5 h-5 text-[#946df7] flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-white mb-1">Richtlinie (EU) 2023/970</h3>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    Gleicher Lohn für gleiche Arbeit — durch Transparenz und Durchsetzungsmechanismen.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-white/30 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        DSGVO-konform · EU-Hosting · Verschlüsselt
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f9f9f9]">
                <div className="w-full max-w-md">
                    <Link
                        href="https://klargehalt.de"
                        className="inline-flex items-center gap-2 text-sm text-[#535a6b] hover:text-[#071423] mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zur Startseite
                    </Link>

                    <div className="lg:hidden mb-8">
                        <Image src="/brandname.svg" alt="klargehalt" width={160} height={24} className="h-6 w-auto" />
                    </div>

                    <div className="bg-white rounded-2xl border border-[#e0e0e2] shadow-lg p-8">
                        <h2 className="text-2xl font-extrabold text-[#071423] tracking-tight mb-2">{copy.title}</h2>
                        <p className="text-sm text-[#535a6b] mb-6">
                            {copy.body}
                        </p>

                        {alreadyAuthenticated ? (
                            <div className="flex items-center gap-3 rounded-xl border border-[#e0e0e2] bg-[#f9f9f9] p-4 text-sm text-[#535a6b]">
                                <Loader2 className="w-4 h-4 text-[#946df7] animate-spin flex-shrink-0" />
                                <span>Sie sind bereits angemeldet — Sie werden weitergeleitet...</span>
                            </div>
                        ) : (
                            <>
                                <Link href={copy.ctaHref} className="block mb-4" aria-disabled={!isLoaded} tabIndex={isLoaded ? undefined : -1}>
                                    <Button
                                        disabled={!isLoaded}
                                        className="w-full h-12 rounded-xl bg-[#071423] text-white hover:bg-[#0d1f33] text-sm font-semibold cursor-pointer"
                                    >
                                        {isLoaded ? copy.cta : (
                                            <span className="inline-flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                {copy.cta}
                                            </span>
                                        )}
                                    </Button>
                                </Link>
                                <p className="text-sm text-[#535a6b]">
                                    {copy.footerPrompt}{' '}
                                    <Link href={copy.footerLinkHref} className="text-[#946df7] font-semibold hover:underline">
                                        {copy.footerLinkLabel}
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-[#aaacb5]">
                        <span>AES-256</span>
                        <span className="w-1 h-1 rounded-full bg-[#e0e0e2]" />
                        <span>Frankfurt</span>
                        <span className="w-1 h-1 rounded-full bg-[#e0e0e2]" />
                        <span>Row Level Security</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
