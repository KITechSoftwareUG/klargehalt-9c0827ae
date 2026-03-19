"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const HeroSection = () => {
  return (
    <section className="relative">
      {/* ── Screen 1: Video fills the entire viewport ── */}
      <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            maskImage:
              "radial-gradient(ellipse 75% 65% at 50% 50%, black 15%, transparent 68%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 65% at 50% 50%, black 15%, transparent 68%)",
          }}
        >
          <source src="/balken.mp4" type="video/mp4" />
        </video>

        {/* Radial fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 85% 75% at 50% 50%, transparent 20%, hsl(var(--background)) 68%)",
          }}
        />

        {/* Top + bottom fades */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-pulse-gentle">
          <div className="w-5 h-8 rounded-full border-2 border-foreground/15 flex items-start justify-center pt-1.5">
            <div className="w-1 h-1.5 rounded-full bg-foreground/25" />
          </div>
        </div>
      </div>

      {/* ── Screen 2: Content appears on scroll ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 lg:px-8 py-24 lg:py-32 -mt-24">
        {/* Badge */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-status-warning/20 bg-background/80 backdrop-blur-md text-status-warning text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse-gentle" />
            Pflicht ab Juni 2026
          </span>
        </div>

        {/* Brand wordmark — GROSS */}
        <div className="mb-10">
          <Image
            src="/brandname.svg"
            alt="KlarGehalt"
            width={900}
            height={120}
            priority
            className="h-16 sm:h-20 md:h-28 lg:h-36 xl:h-44 w-auto max-w-[90vw]"
          />
        </div>

        {/* Subheadline */}
        <div className="mb-10 max-w-3xl">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-normal text-foreground/70 tracking-tight leading-snug">
            Entgelttransparenz{" "}
            <span className="font-semibold text-foreground">rechtssicher</span>{" "}
            umsetzen
          </h1>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-12">
          {["DSGVO-konform", "EU-Richtlinie 2023/970", "Revisionssicher"].map(
            (b) => (
              <span
                key={b}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                {b}
              </span>
            )
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={getAppUrl("/sign-up")}>
            <Button variant="hero" size="xl" className="group w-full sm:w-auto">
              Kostenlose Demo
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="#features">
            <Button
              variant="hero-outline"
              size="xl"
              className="w-full sm:w-auto"
            >
              Mehr erfahren
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
