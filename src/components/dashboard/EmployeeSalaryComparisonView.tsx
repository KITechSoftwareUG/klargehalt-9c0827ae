import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePayGapStatistics } from '@/hooks/usePayGapStatistics';
import { useAuth } from '@/hooks/useAuth';
import { 
  StatusBadge, 
  InfoBox, 
  DataValue,
  ProgressWithContext,
  EmptyState,
  LEGAL_TEXTS
} from '@/components/ui/status-components';
import { 
  Scale, 
  TrendingUp, 
  Users, 
  Lock,
  ShieldCheck,
  Info,
  FileText
} from 'lucide-react';

/**
 * Mitarbeiter-Ansicht: Anonymisierter Gehaltsvergleich
 * 
 * UX-Prinzipien:
 * - Keine Angst erzeugen
 * - Immer Kontext liefern
 * - Klare, juristisch sichere Sprache
 * - Ampellogik nur wo sinnvoll
 */
export function EmployeeSalaryComparisonView() {
  const { profile } = useAuth();
  const { loading, getSalaryStatistics } = usePayGapStatistics();
  const [stats, setStats] = useState<any[]>([]);
  const [hasData, setHasData] = useState<boolean | null>(null);

  // In einer echten Implementierung würde hier die Job-Zuordnung des Mitarbeiters geladen
  // Für die Demo zeigen wir einen informativen Zustand

  useEffect(() => {
    // Simuliere Datenprüfung - in Produktion: echte Abfrage
    const timer = setTimeout(() => {
      setHasData(false); // Demo: Keine Zuordnung vorhanden
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (hasData === null || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Zustand: Keine Job-Zuordnung vorhanden
  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            Gehaltsvergleich
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Anonymisierte Einordnung in Ihr Entgeltband
          </p>
        </div>

        <Card className="border-border/50">
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="Noch keine Zuordnung vorhanden"
              description="Ihr Profil wurde noch nicht einem Job-Profil und Entgeltband zugeordnet. Dies ist Voraussetzung für den Gehaltsvergleich."
              action={
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Auskunftsanfrage stellen
                </Button>
              }
            />
          </CardContent>
        </Card>

        <InfoBox variant="legal">
          <p className="font-medium mb-1">Ihr Recht auf Information</p>
          <p>{LEGAL_TEXTS.euDirective.rightToInfo}</p>
          <p className="mt-2">{LEGAL_TEXTS.general.contactHR}</p>
        </InfoBox>
      </div>
    );
  }

  // Zustand: Daten vorhanden (Demo-Daten)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          Gehaltsvergleich
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Anonymisierte Einordnung basierend auf Ihrem Job-Profil und Level
        </p>
      </div>

      {/* Datenschutz-Hinweis */}
      <InfoBox variant="info" title="Datenschutz">
        {LEGAL_TEXTS.dataPrivacy.aggregation}
      </InfoBox>

      {/* Hauptkarte: Position im Entgeltband */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ihre Position im Entgeltband
          </CardTitle>
          <CardDescription>
            Anonymisierte Darstellung Ihrer Einordnung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Entgeltband-Visualisierung */}
          <div className="p-6 rounded-lg bg-muted/30 border border-border/50">
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <DataValue 
                label="Minimum"
                value={45000}
                format="currency"
                helpText="Untere Grenze des Entgeltbands für Ihr Job-Profil und Level"
              />
              <DataValue 
                label="Median"
                value={52000}
                format="currency"
                status="success"
                helpText="Mittlerer Wert - 50% verdienen mehr, 50% weniger"
              />
              <DataValue 
                label="Maximum"
                value={60000}
                format="currency"
                helpText="Obere Grenze des Entgeltbands"
              />
            </div>
            
            <ProgressWithContext
              value={55}
              label="Ihre Position im Band"
              context="Sie befinden sich im mittleren Bereich Ihres Entgeltbands."
              status="success"
              showPercent={false}
            />
          </div>

          {/* Quartil-Anzeige */}
          <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-status-success-bg border border-status-success/20">
            <ShieldCheck className="h-5 w-5 text-status-success" />
            <span className="font-medium text-status-success">
              Quartil 2 von 4 — Mittlerer Bereich
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Kontext-Informationen */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vergleichsgruppe</CardTitle>
          </CardHeader>
          <CardContent>
            <DataValue 
              label="Personen in dieser Gruppe"
              value={12}
              format="number"
              context={LEGAL_TEXTS.dataPrivacy.minGroupSize(5)}
            />
          </CardContent>
        </Card>
        
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Job-Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">Software Engineer</p>
            <p className="text-sm text-muted-foreground mt-1">Level: Mid</p>
          </CardContent>
        </Card>
      </div>

      {/* Was bedeutet das? */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Was bedeuten diese Werte?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Entgeltband:</strong> Definiert die 
            Gehaltsspanne für Ihr Job-Profil und Karrierelevel. Die Spanne berücksichtigt 
            Faktoren wie Erfahrung, Qualifikation und Verantwortungsbereich.
          </p>
          <p>
            <strong className="text-foreground">Median:</strong> Der mittlere Wert 
            aller Gehälter in Ihrer Vergleichsgruppe. Nicht zu verwechseln mit dem 
            Durchschnitt (Mittelwert).
          </p>
          <p>
            <strong className="text-foreground">Quartile:</strong> Unterteilen die 
            Gehaltsspanne in vier gleiche Teile. Quartil 2 bedeutet, dass Sie im 
            Bereich zwischen 25% und 50% der Gehaltsspanne liegen.
          </p>
        </CardContent>
      </Card>

      {/* Rechtlicher Footer */}
      <Card className="border-border/30 bg-muted/30">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground text-center">
            {LEGAL_TEXTS.euDirective.reference} • {LEGAL_TEXTS.general.noGuarantee}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
