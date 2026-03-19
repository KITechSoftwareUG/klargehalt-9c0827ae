"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { BrandName } from "@/components/BrandName";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const HeroSection = () => {
  const benefits = [
    "DSGVO-konform",
    "EU-Richtlinie 2023/970",
    "Revisionssicher",
  ];

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{
            maskImage:
              "radial-gradient(ellipse 65% 60% at 50% 50%, black 25%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 60% at 50% 50%, black 25%, transparent 72%)",
          }}
        >
          <source src="/balken.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Additional edge fade to ensure clean bleed into concrete background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 75% at 50% 50%, transparent 30%, hsl(var(--background)) 72%)",
        }}
      />

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

      {/* Content — Centered */}
      <div className="relative z-20 container mx-auto px-4 lg:px-8 py-24 lg:py-32 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="animate-fade-in mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-status-warning-bg text-status-warning text-sm font-semibold backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse-gentle" />
            Pflicht ab Juni 2026
          </span>
        </div>

        {/* Brandname — Large wordmark */}
        <div className="animate-fade-in animation-delay-100 mb-8">
          <BrandName className="h-10 md:h-14 lg:h-[72px] xl:h-20" color="hsl(var(--foreground))" />
        </div>

        {/* Headline */}
        <div className="space-y-5 animate-fade-in animation-delay-200 max-w-3xl">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-foreground leading-relaxed tracking-tight text-balance">
            Entgelttransparenz{" "}
            <span className="text-accent font-semibold">rechtssicher</span>{" "}
            umsetzen
          </h1>
          <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Schuetzen Sie Ihr Unternehmen vor Klagen, Bussgeldern und Chaos.
            Die B2B-Compliance-Plattform fuer die EU-Entgelttransparenzrichtlinie.
          </p>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-6 mt-8 animate-fade-in animation-delay-300">
          {benefits.map((benefit) => (
            <div
              key={benefit}
              className="flex items-center gap-2 text-sm font-medium text-foreground/80"
            >
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              {benefit}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 animate-fade-in animation-delay-400">
          <Link href={getAppUrl("/sign-up")}>
            <Button
              variant="hero"
              size="xl"
              className="group w-full sm:w-auto"
            >
              Kostenlose Demo
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="#features">
            <Button
              variant="hero-outline"
              size="xl"
              className="w-full sm:w-auto backdrop-blur-sm"
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
