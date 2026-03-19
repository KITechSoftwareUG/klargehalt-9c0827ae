"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getAppUrl } from "@/utils/url";

const HeroSection = () => {
  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden">
      {/* Animated background — subtle moving gradient mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Slow drifting orbs */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)",
            top: "-20%",
            right: "-10%",
            animation: "drift-1 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, hsl(var(--foreground)) 0%, transparent 70%)",
            bottom: "-15%",
            left: "-5%",
            animation: "drift-2 30s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.025]"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)",
            top: "40%",
            left: "30%",
            animation: "drift-3 20s ease-in-out infinite",
          }}
        />
      </div>

      {/* Horizontal accent lines — architectural, minimal */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[18%] left-0 right-[60%] h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        <div className="absolute top-[82%] left-[50%] right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto w-full px-4 lg:px-8 pt-32 pb-20 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="mb-14 animate-fade-in opacity-0">
          <span className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-status-warning/15 bg-background/70 backdrop-blur-md text-status-warning text-sm font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse-gentle" />
            Pflicht ab Juni 2026
          </span>
        </div>

        {/* Brand wordmark — MASSIVE */}
        <div className="mb-14 animate-fade-in opacity-0 animation-delay-100 w-full flex justify-center">
          <Image
            src="/brandname.svg"
            alt="KlarGehalt"
            width={1200}
            height={160}
            priority
            className="w-[85vw] sm:w-[75vw] md:w-[65vw] lg:w-[55vw] xl:w-[50vw] h-auto"
          />
        </div>

        {/* Subheadline */}
        <div className="mb-10 max-w-2xl animate-fade-in opacity-0 animation-delay-200">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-light text-muted-foreground tracking-tight leading-relaxed">
            Entgelttransparenz{" "}
            <span className="font-semibold text-foreground">rechtssicher</span>{" "}
            umsetzen
          </h1>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 mb-14 animate-fade-in opacity-0 animation-delay-300">
          {["DSGVO-konform", "EU-Richtlinie 2023/970", "Revisionssicher"].map(
            (b) => (
              <span
                key={b}
                className="flex items-center gap-2 text-sm text-muted-foreground/70"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success/70" />
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
              className="w-full sm:w-auto"
            >
              Mehr erfahren
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Inline keyframes for drift animations */}
      <style jsx>{`
        @keyframes drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.05); }
          66% { transform: translate(20px, -20px) scale(0.95); }
        }
        @keyframes drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.03); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -30px) scale(1.08); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
