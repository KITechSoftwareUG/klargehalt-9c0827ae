"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Scale, FileCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const trustItems = [
  { icon: Shield, text: "ISO 27001 zertifiziert" },
  { icon: Scale, text: "EU-Richtlinie 2023/970" },
  { icon: FileCheck, text: "DSGVO-konform" },
];

const stats = [
  { value: "2.400+", label: "Unternehmen" },
  { value: "340k", label: "Mitarbeiter verwaltet" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 24h", label: "Support-Antwortzeit" },
];

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden pt-[72px]">
      {/* Animated background — slow floating mesh gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />

      {/* Floating gradient orbs — very subtle, enterprise-appropriate */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full blur-[100px]"
          style={{
            width: "600px",
            height: "600px",
            top: "-10%",
            right: "-5%",
            background: "rgba(37, 99, 235, 0.06)",
            animation: "float-1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full blur-[120px]"
          style={{
            width: "500px",
            height: "500px",
            bottom: "-5%",
            left: "-8%",
            background: "rgba(37, 99, 235, 0.04)",
            animation: "float-2 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full blur-[80px]"
          style={{
            width: "300px",
            height: "300px",
            top: "30%",
            left: "40%",
            background: "rgba(5, 150, 105, 0.03)",
            animation: "float-3 18s ease-in-out infinite",
          }}
        />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(30,41,59,1) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 lg:pt-36 pb-20 lg:pb-28">
        {/* Main content — asymmetric split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left — 7 cols */}
          <div className="lg:col-span-7 animate-fade-in opacity-0">
            {/* Wordmark — large */}
            <div className="mb-6">
              <Image
                src="/brandname.svg"
                alt="KlarGehalt"
                width={500}
                height={65}
                priority
                className="h-12 sm:h-14 lg:h-16 w-auto"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-extrabold text-[#1E293B] tracking-tight leading-[1.15] mb-5">
              Entgelttransparenz
              <br />
              rechtssicher umsetzen.
            </h1>

            <p className="text-base lg:text-lg text-slate-500 leading-relaxed max-w-[52ch] mb-8">
              Die Compliance-Plattform fuer die EU-Entgelttransparenzrichtlinie.
              Gehaltsstrukturen verwalten, Lohngleichheit nachweisen,
              Auskunftspflichten erfuellen — bevor die Frist ablaeuft.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10 animate-fade-in opacity-0 animation-delay-100">
              <Link href={getAppUrl("/sign-up")}>
                <Button className="group bg-[#2563EB] text-white hover:bg-[#1D4ED8] h-12 px-7 rounded-lg text-sm font-semibold shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/25 transition-all cursor-pointer w-full sm:w-auto">
                  Kostenlose Demo anfragen
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  variant="outline"
                  className="h-12 px-7 rounded-lg text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer w-full sm:w-auto"
                >
                  Funktionen ansehen
                </Button>
              </Link>
            </div>

            {/* Trust icons */}
            <div className="flex flex-wrap gap-5 animate-fade-in opacity-0 animation-delay-200">
              {trustItems.map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-[#059669]" />
                  <span className="text-xs font-medium text-slate-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — 5 cols: Stats card */}
          <div className="lg:col-span-5 animate-fade-in opacity-0 animation-delay-200">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-8">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.15em] mb-6">
                Plattform in Zahlen
              </p>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl lg:text-3xl font-extrabold text-[#1E293B] tracking-tight">
                      {s.value}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini trust bar under stats */}
            <div className="mt-4 flex items-center justify-center gap-6 py-3">
              {["SOC 2", "DSGVO", "ISO 27001"].map((badge) => (
                <span key={badge} className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.2em]">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 20px) scale(1.05); }
          66% { transform: translate(15px, -15px) scale(0.97); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(25px, -30px) scale(1.03); }
          70% { transform: translate(-15px, 15px) scale(0.98); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(35px, -20px) scale(1.06); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
