"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      {/* Video Background — fullscreen behind everything */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{
            maskImage:
              "radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 70%)",
          }}
        >
          <source src="/balken.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Radial fade overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 25%, hsl(var(--background)) 70%)",
        }}
      />

      {/* Edge fades */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-background to-transparent pointer-events-none z-[1]" />
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-background to-transparent pointer-events-none z-[1]" />

      {/* Content — centered over the video with enough contrast */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 lg:px-8 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="animate-fade-in opacity-0 mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-status-warning/20 bg-background/60 backdrop-blur-md text-status-warning text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse-gentle" />
            Pflicht ab Juni 2026
          </span>
        </div>

        {/* Brand wordmark */}
        <div className="animate-fade-in opacity-0 animation-delay-100 mb-6">
          <Image
            src="/brandname.svg"
            alt="KlarGehalt"
            width={520}
            height={70}
            priority
            className="h-10 md:h-14 lg:h-[68px] w-auto"
          />
        </div>

        {/* Subheadline */}
        <div className="animate-fade-in opacity-0 animation-delay-200 mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-normal text-foreground/80 tracking-tight leading-snug">
            Entgelttransparenz{" "}
            <span className="font-semibold text-foreground">rechtssicher</span>{" "}
            umsetzen
          </h1>
        </div>

        {/* Benefits — horizontal */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 animate-fade-in opacity-0 animation-delay-300 mb-10">
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
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in opacity-0 animation-delay-400">
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
