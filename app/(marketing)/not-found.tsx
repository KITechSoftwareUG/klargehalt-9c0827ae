import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
    return (
        <section className="pt-[72px] bg-[#071423] min-h-screen flex items-center">
            <div className="max-w-3xl mx-auto px-5 sm:px-8 py-24 text-center">
                <p className="text-[#52e0de] text-sm font-semibold tracking-wide uppercase mb-5">
                    Fehler 404
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                    Diese Seite gibt es nicht.
                </h1>
                <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[48ch] mx-auto mb-10">
                    Der Link ist möglicherweise veraltet oder die Seite wurde verschoben.
                    Hier geht es zurück zu KlarGehalt.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/">
                        <Button className="bg-[#52e0de] text-[#071423] hover:brightness-95 h-11 px-6 rounded-full text-sm font-semibold cursor-pointer group">
                            Zur Startseite
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                    </Link>
                    <Link href="/kontakt">
                        <Button
                            variant="outline"
                            className="h-11 px-6 rounded-full text-sm font-semibold bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                            Kontakt aufnehmen
                        </Button>
                    </Link>
                </div>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                    <Link href="/funktionen" className="text-white/50 hover:text-white transition-colors">
                        Funktionen
                    </Link>
                    <Link href="/preise" className="text-white/50 hover:text-white transition-colors">
                        Preise
                    </Link>
                    <Link href="/eu-richtlinie" className="text-white/50 hover:text-white transition-colors">
                        EU-Richtlinie
                    </Link>
                    <Link href="/sicherheit" className="text-white/50 hover:text-white transition-colors">
                        Sicherheit
                    </Link>
                </div>
            </div>
        </section>
    );
}
