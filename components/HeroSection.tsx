"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, FileCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pt-[72px] bg-white">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-40 pb-20 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left — main message */}
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
              <Link href={getAppUrl("/sign-up")}>
                <Button className="group bg-[#1E293B] text-white hover:bg-[#0F172A] h-13 px-8 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer w-full sm:w-auto">
                  Kostenlose Demo starten
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#features">
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

          {/* Right — deadline urgency card */}
          <div className="lg:col-span-5 lg:mt-8">
            <div className="bg-[#1E293B] rounded-2xl p-8 lg:p-10 text-white">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em] mb-6">
                EU-Entgelttransparenzrichtlinie
              </p>

              <div className="space-y-6">
                <div>
                  <p className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-1">
                    Juni 2026
                  </p>
                  <p className="text-sm text-slate-400">Umsetzungsfrist fuer Unternehmen ab 100 MA</p>
                </div>

                <div className="h-px bg-white/10" />

                <ul className="space-y-3">
                  {[
                    "Gehaltsstrukturen muessen offengelegt werden",
                    "Gender-Pay-Gap Berichte werden Pflicht",
                    "Mitarbeiter erhalten Auskunftsrecht",
                    "Bussgelder bei Nichterfuellung",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="w-1 h-1 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </section>
  );
};

export default HeroSection;
