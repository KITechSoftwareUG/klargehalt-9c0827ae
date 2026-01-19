'use client';

import { SignIn } from '@clerk/nextjs';
import { ArrowLeft, Clock, AlertCircle, Scale } from 'lucide-react';
import { Logo } from '@/components/Logo';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SignInPage() {
    // Countdown to June 7, 2026 (EU Pay Transparency Directive deadline)
    const targetDate = new Date('2026-06-07T00:00:00');
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Brand/Marketing with Countdown */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

                    {/* Grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-xl border border-primary/30 shadow-lg">
                            <Logo className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-white lowercase tracking-tight">klargehalt</span>
                    </div>

                    {/* Alert Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm mb-6">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-200">Wichtige Gesetzesänderung</span>
                    </div>

                    {/* Main Message */}
                    <div className="space-y-6 mb-10">
                        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                            EU-Entgelttransparenz-richtlinie
                        </h1>
                        <p className="text-lg text-slate-300 leading-relaxed">
                            Ab dem <span className="text-white font-semibold">7. Juni 2026</span> müssen alle Unternehmen mit mehr als 100 Mitarbeitern die EU-Richtlinie 2023/970 zur Entgelttransparenz umsetzen.
                        </p>
                    </div>

                    {/* Countdown Timer */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Zeit bis zur Umsetzung</span>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { value: timeLeft.days, label: 'Tage' },
                                { value: timeLeft.hours, label: 'Stunden' },
                                { value: timeLeft.minutes, label: 'Minuten' },
                                { value: timeLeft.seconds, label: 'Sekunden' },
                            ].map((item, index) => (
                                <div key={index} className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                                    <div className="relative bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-4 text-center hover:border-primary/30 transition-all duration-300">
                                        <div className="text-3xl font-bold text-white mb-1 tabular-nums">
                                            {String(item.value).padStart(2, '0')}
                                        </div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wide">
                                            {item.label}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Law Reference */}
                    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                                <Scale className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-white mb-1">
                                    Richtlinie (EU) 2023/970
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Zur Stärkung der Anwendung des Grundsatzes des gleichen Entgelts für Männer und Frauen bei gleicher oder gleichwertiger Arbeit durch Entgelttransparenz und Durchsetzungsmechanismen.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span>DSGVO-konform • EU-Server • Verschlüsselt</span>
                    </div>
                    <p className="text-slate-500 text-xs">
                        © 2024 KlarGehalt. Alle Rechte vorbehalten.
                    </p>
                </div>

                <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
            </div>

            {/* Right Side - Clerk Default */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    {/* Back Button */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zur Startseite
                    </Link>

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
                            <Logo className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-2xl font-bold text-foreground lowercase tracking-tight">klargehalt</span>
                    </div>

                    {/* Clerk Sign-In - Completely Default */}
                    <SignIn />
                </div>
            </div>
        </div>
    );
}
