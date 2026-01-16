import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, CheckCircle2 } from "lucide-react";

const HeroSection = () => {
  const benefits = [
    "DSGVO-konform",
    "EU-Richtlinie 2023/970",
    "Revisionssicher",
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-20 lg:pt-0 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background" />
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-status-warning-bg text-status-warning text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse-gentle" />
                Pflicht ab Juni 2026
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4 animate-fade-in animation-delay-100">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight tracking-tight text-balance">
                Entgelttransparenz{" "}
                <span className="text-accent">rechtssicher</span>{" "}
                umsetzen
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Schützen Sie Ihr Unternehmen vor Klagen, Bußgeldern und Chaos. 
                Unsere B2B-Lösung sichert Sie bei der Umsetzung der EU-Entgelttransparenzrichtlinie ab.
              </p>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap gap-4 animate-fade-in animation-delay-200">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                  {benefit}
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-300">
              <Button variant="hero" size="xl" className="group">
                Kostenlose Demo
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="hero-outline" size="xl">
                Mehr erfahren
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-4 animate-fade-in animation-delay-400">
              <p className="text-sm text-muted-foreground mb-3">
                Vertraut von führenden Unternehmen
              </p>
              <div className="flex items-center gap-6 opacity-60">
                <div className="h-6 w-20 bg-foreground/20 rounded" />
                <div className="h-6 w-24 bg-foreground/20 rounded" />
                <div className="h-6 w-16 bg-foreground/20 rounded" />
                <div className="hidden sm:block h-6 w-20 bg-foreground/20 rounded" />
              </div>
            </div>
          </div>

          {/* Right - Dashboard Preview */}
          <div className="relative animate-slide-up animation-delay-200">
            <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 to-primary/20 rounded-3xl blur-3xl opacity-30" />
            <div className="relative bg-card rounded-2xl shadow-elegant border border-border overflow-hidden">
              {/* Window Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-status-danger" />
                <div className="w-3 h-3 rounded-full bg-status-warning" />
                <div className="w-3 h-3 rounded-full bg-status-success" />
                <span className="ml-2 text-xs text-muted-foreground font-medium">
                  KlarGehalt Dashboard
                </span>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-secondary/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Compliance Status</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-status-success" />
                      <span className="text-lg font-bold text-foreground">94%</span>
                    </div>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Gehaltsgruppen</p>
                    <span className="text-lg font-bold text-foreground">24</span>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Offene Anfragen</p>
                    <span className="text-lg font-bold text-foreground">3</span>
                  </div>
                </div>

                {/* Compliance Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-status-success-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-status-success" />
                      <span className="text-sm font-medium text-foreground">Entgeltstruktur vollständig</span>
                    </div>
                    <span className="text-xs text-status-success font-semibold">Konform</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-status-warning-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-status-warning" />
                      <span className="text-sm font-medium text-foreground">Gender Pay Gap Analyse</span>
                    </div>
                    <span className="text-xs text-status-warning font-semibold">Prüfen</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-status-success-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-status-success" />
                      <span className="text-sm font-medium text-foreground">Audit-Protokolle aktiv</span>
                    </div>
                    <span className="text-xs text-status-success font-semibold">Konform</span>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-3">Letzte Aktivität</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Auskunftsanfrage bearbeitet</p>
                        <p className="text-xs text-muted-foreground">vor 2 Stunden</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
