'use client';

import { ArrowLeft, Clock, AlertCircle, Scale } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SignUpPage() {
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
                    <div className="mb-12">
                        <Image src="/brandname.svg" alt="KlarGehalt" width={200} height={30} className="h-8 w-auto invert" />
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
                        © 2025 KlarGehalt. Alle Rechte vorbehalten.
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

            {/* Right Side - Logto Sign-Up */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    {/* Back Button */}
                    <Link
                        href="https://klargehalt.de"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück zur Startseite
                    </Link>

                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8">
                        <Image src="/brandname.svg" alt="KlarGehalt" width={160} height={24} className="h-6 w-auto" />
                    </div>

                    <Card className="border-slate-200 shadow-xl">
                        <CardHeader className="space-y-3">
                            <CardTitle className="text-2xl">Konto erstellen</CardTitle>
                            <CardDescription>
                                Erstellen Sie Ihr KlarGehalt-Konto und richten Sie anschließend Ihr Unternehmen ein. Ihre Daten werden DSGVO-konform auf EU-Servern gespeichert.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href="/auth/sign-up" className="block">
                                <Button className="w-full" size="lg">
                                    Kostenlos registrieren
                                </Button>
                            </Link>
                            <p className="text-sm text-muted-foreground">
                                Bereits registriert?{' '}
                                <Link href="/sign-in" className="text-primary hover:underline">
                                    Zur Anmeldung
                                </Link>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
