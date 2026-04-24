import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Briefcase, Mail } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Karriere',
    description: 'Offene Stellen bei KlarGehalt. Aktuell keine ausgeschriebenen Positionen — Initiativbewerbungen sind willkommen.',
};

export default function KarrierePage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--ep-purple)]/20 text-[var(--ep-purple-light)] mb-5">
                            Karriere
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                            Offene Stellen.
                        </h1>
                        <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch]">
                            Faire Bezahlung fängt bei uns selbst an. Wenn wir wachsen, suchen wir Menschen,
                            die das mit uns gestalten wollen.
                        </p>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-white" />
            </section>

            {/* Job List */}
            <section className="py-20 lg:py-28">
                <div className="max-w-3xl mx-auto px-5 sm:px-8">

                    {/* No open positions notice */}
                    <div className="flex flex-col items-center text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50 gap-5">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#071423] mb-2">Aktuell keine offenen Stellen</h2>
                            <p className="text-sm text-slate-500 max-w-[38ch] mx-auto leading-relaxed">
                                Wir haben momentan keine ausgeschriebenen Positionen.
                                Initiativbewerbungen sind aber jederzeit willkommen.
                            </p>
                        </div>
                    </div>

                    {/* Initiative application */}
                    <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-7 lg:p-10">
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-lg bg-[var(--ep-purple-light)] flex items-center justify-center flex-shrink-0">
                                <Mail className="w-5 h-5 text-[var(--ep-purple-dark)]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-[#071423] mb-2">Initiativbewerbung</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                                    Sie finden sich in unserer Mission wieder und möchten Teil des Teams werden?
                                    Schicken Sie uns Ihre Bewerbung — wir freuen uns über jede ernsthafte Nachricht.
                                </p>
                                <Link href="mailto:info@klargehalt.de?subject=Initiativbewerbung">
                                    <Button className="bg-[#071423] text-white hover:bg-[#0d1f33] h-10 px-5 rounded-lg text-sm font-semibold cursor-pointer group">
                                        Jetzt bewerben
                                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
