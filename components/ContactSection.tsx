import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 lg:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20">
          {/* Left */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight mb-4">
                Sprechen wir darüber.
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[40ch]">
                Wir zeigen Ihnen in 20 Minuten, wie KlarGehalt für Ihr Unternehmen funktioniert.
              </p>
            </div>

            <div className="space-y-4">
              <InfoRow label="E-Mail" value="info@klargehalt.de" />
              <InfoRow label="Telefon" value="+49 (0) 30 847 291 03" />
              <InfoRow label="Standort" value="Berlin, Deutschland" />
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-400">Antwort innerhalb von 24h</span>
            </div>
          </div>

          {/* Right — Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 p-7 lg:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h3 className="text-base font-bold text-[#1E293B] tracking-tight mb-1">Demo anfragen</h3>
              <p className="text-xs text-slate-400 mb-7">Wir melden uns innerhalb eines Werktags.</p>

              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Vorname" id="fn" placeholder="Max" />
                  <Field label="Nachname" id="ln" placeholder="Mustermann" />
                </div>
                <Field label="Geschäftliche E-Mail" id="email" type="email" placeholder="m.mustermann@firma.de" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Unternehmen" id="co" placeholder="Unternehmen GmbH" />
                  <div>
                    <label htmlFor="size" className="block text-xs font-medium text-slate-600 mb-1.5">Mitarbeiteranzahl</label>
                    <select id="size" className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/40 transition-all cursor-pointer">
                      <option value="">Bitte wählen</option>
                      <option value="1-50">1 – 50</option>
                      <option value="51-250">51 – 250</option>
                      <option value="251-1000">251 – 1.000</option>
                      <option value="1000+">1.000+</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="msg" className="block text-xs font-medium text-slate-600 mb-1.5">Nachricht (optional)</label>
                  <textarea
                    id="msg"
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-[#1E293B] placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/40 transition-all resize-none"
                    placeholder="Wie können wir helfen?"
                  />
                </div>
                <Button className="w-full h-11 bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-lg text-sm font-semibold shadow-sm group cursor-pointer">
                  Demo anfragen
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <p className="text-[10px] text-slate-300 text-center">Mit dem Absenden stimmen Sie unserer Datenschutzerklärung zu.</p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-300 uppercase tracking-[0.15em] mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[#1E293B]">{value}</p>
    </div>
  );
}

function Field({ label, id, type = 'text', placeholder }: { label: string; id: string; type?: string; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type={type}
        id={id}
        className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-[#1E293B] placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]/40 transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

export default ContactSection;
