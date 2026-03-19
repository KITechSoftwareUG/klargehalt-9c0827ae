"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden bg-white">
      {/* Subtle top-right gradient wash */}
      <div
        className="absolute top-0 right-0 w-[60%] h-[70%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 80% 20%, hsl(217 91% 60% / 0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 lg:px-10 pt-40 pb-24">
        {/* Regulation badge */}
        <div className="mb-12 animate-fade-in opacity-0">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium tracking-wide border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-gentle" />
            EU-Pflicht ab Juni 2026
          </span>
        </div>

        {/* Wordmark — dominant, full width */}
        <div className="mb-8 animate-fade-in opacity-0 animation-delay-100">
          <Image
            src="/brandname.svg"
            alt="KlarGehalt"
            width={1400}
            height={180}
            priority
            className="w-full max-w-[900px] h-auto"
          />
        </div>

        {/* Headline + CTA row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-end animate-fade-in opacity-0 animation-delay-200">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-[28px] font-normal text-foreground/60 leading-relaxed tracking-tight max-w-[44ch]">
              Die Compliance-Plattform fuer die
              EU-Entgelttransparenzrichtlinie. Gehaltsstrukturen verwalten,
              Lohngleichheit nachweisen, Auskunftspflichten erfuellen.
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
            <Link href={getAppUrl("/sign-up")}>
              <Button className="group bg-foreground text-background hover:bg-foreground/90 h-12 px-8 rounded-lg text-sm font-medium w-full sm:w-auto">
                Kostenlose Demo
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" className="h-12 px-8 rounded-lg text-sm font-medium border-border/60 w-full sm:w-auto">
                Mehr erfahren
              </Button>
            </Link>
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-20 pt-10 border-t border-border/40 animate-fade-in opacity-0 animation-delay-300">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {[
              "DSGVO-konform",
              "EU-Richtlinie 2023/970",
              "ISO 27001",
              "SOC 2 Type II",
              "Hosting in Frankfurt",
            ].map((item) => (
              <span
                key={item}
                className="text-xs font-medium text-foreground/25 uppercase tracking-[0.15em]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
