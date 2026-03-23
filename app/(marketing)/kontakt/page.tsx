import type { Metadata } from 'next';
import ContactForm from './contact-form';

export const metadata: Metadata = {
    title: 'Kontakt',
    description: 'Kontaktieren Sie KlarGehalt für eine Demo, Beratung oder technische Fragen. Antwort innerhalb eines Werktags.',
};

export default function KontaktPage() {
    return (
        <>
            {/* Hero */}
            <section className="pt-[72px] bg-[#071423]">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-16">
                    <div className="max-w-3xl">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--ep-teal)]/20 text-[var(--ep-teal)] mb-5">
                            Kontakt aufnehmen
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-extrabold text-white tracking-tight leading-[1.1] mb-6">
                            Sprechen wir darüber.
                        </h1>
                        <p className="text-base lg:text-lg text-white/60 leading-relaxed max-w-[55ch]">
                            Ob Demo, Beratung oder technische Fragen — wir sind für Sie da.
                            Melden Sie sich und wir antworten innerhalb eines Werktags.
                        </p>
                    </div>
                </div>
                <div className="h-24 bg-gradient-to-b from-[#071423] to-white" />
            </section>

            <ContactForm />
        </>
    );
}
