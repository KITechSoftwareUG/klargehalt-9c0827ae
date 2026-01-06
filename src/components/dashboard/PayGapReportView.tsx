import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileBarChart, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  Building2,
  ShieldCheck,
  Download,
  RefreshCw,
  Lock,
  Info
} from 'lucide-react';
import { usePayGapStatistics, PayEquityReport, DepartmentStatistic } from '@/hooks/usePayGapStatistics';
import { usePermissions } from '@/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export function PayGapReportView() {
  const { 
    loading, 
    generatePayEquityReport, 
    getDepartmentStatistics,
    analyzeDeviations 
  } = usePayGapStatistics();
  const { hasPermission } = usePermissions();
  
  const [report, setReport] = useState<PayEquityReport | null>(null);
  const [deptStats, setDeptStats] = useState<DepartmentStatistic[]>([]);
  const [deviations, setDeviations] = useState<any[]>([]);
  
  const canViewReport = hasPermission('reports.pay_gap') || hasPermission('audit.view');

  useEffect(() => {
    if (canViewReport) {
      loadData();
    }
  }, [canViewReport]);

  const loadData = async () => {
    const [reportData, stats, devs] = await Promise.all([
      generatePayEquityReport(),
      getDepartmentStatistics(),
      analyzeDeviations(20)
    ]);
    
    if (reportData) setReport(reportData);
    setDeptStats(stats);
    setDeviations(devs);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const getGapIndicator = (gap: number | null) => {
    if (gap === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (gap > 5) return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (gap < -5) return <TrendingDown className="h-4 w-4 text-amber-500" />;
    return <Minus className="h-4 w-4 text-emerald-500" />;
  };

  const getGapColor = (gap: number | null) => {
    if (gap === null) return 'bg-muted';
    const absGap = Math.abs(gap);
    if (absGap <= 5) return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
    if (absGap <= 10) return 'bg-amber-500/20 text-amber-700 dark:text-amber-400';
    return 'bg-destructive/20 text-destructive';
  };

  if (!canViewReport) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Zugriff eingeschränkt</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Sie benötigen die Berechtigung "reports.pay_gap" oder "audit.view" 
            um Pay Equity Reports einzusehen.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading && !report) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-primary" />
            Pay Equity Report
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregierte Gehaltsanalyse gemäß EU-Richtlinie 2023/970
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          <Button variant="default" size="sm" disabled={!report}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Anonymisierungshinweis */}
      <Alert className="border-primary/30 bg-primary/5">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Datenschutz gewährleistet</AlertTitle>
        <AlertDescription>
          Alle Werte sind aggregiert mit Mindestgruppengröße {report?.anonymization_threshold || 5}. 
          Kleine Gruppen werden automatisch unterdrückt um Rückschlüsse auf Einzelpersonen zu verhindern.
        </AlertDescription>
      </Alert>

      {/* Kritische Warnungen */}
      {report?.critical_warnings && report.critical_warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Kritische Abweichungen erkannt</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {report.critical_warnings.map((warning, i) => (
                <li key={i} className="text-sm">
                  <strong>{warning.profile}</strong> ({warning.level}): 
                  {warning.deviation}% Abweichung - {warning.recommendation}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Hauptstatistiken */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Gesamter Gender Pay Gap</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              {report?.overall_gap.is_reportable ? (
                <>
                  {getGapIndicator(report.overall_gap.gap_percent)}
                  {report.overall_gap.gap_percent?.toFixed(1)}%
                </>
              ) : (
                <span className="text-muted-foreground text-lg">Nicht berechenbar</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report?.overall_gap.is_reportable && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Männer (Median)</span>
                  <span>{formatCurrency(report.overall_gap.male_median)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frauen (Median)</span>
                  <span>{formatCurrency(report.overall_gap.female_median)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Erfasste Mitarbeiter</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Users className="h-6 w-6 text-primary" />
              {(report?.overall_gap.male_count || 0) + (report?.overall_gap.female_count || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Männer</span>
                <span>{report?.overall_gap.male_count || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frauen</span>
                <span>{report?.overall_gap.female_count || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Abteilungen analysiert</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Building2 className="h-6 w-6 text-primary" />
              {report?.by_department.filter(d => d.is_reportable).length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              von {report?.by_department.length || 0} Abteilungen mit 
              ausreichender Gruppengröße
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs für Details */}
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="departments">Nach Abteilung</TabsTrigger>
          <TabsTrigger value="levels">Nach Level</TabsTrigger>
          <TabsTrigger value="deviations">Abweichungen</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Pay Gap nach Abteilung</CardTitle>
              <CardDescription>
                Vergleich der Median-Gehälter zwischen Geschlechtern pro Abteilung
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report?.by_department.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  Keine Abteilungsdaten verfügbar
                </div>
              ) : (
                <div className="space-y-4">
                  {report?.by_department.map((dept, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{dept.department}</span>
                        {dept.is_reportable ? (
                          <Badge className={getGapColor(dept.gap_percent)}>
                            {dept.gap_percent?.toFixed(1)}% Gap
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Lock className="h-3 w-3 mr-1" />
                            Unterdrückt
                          </Badge>
                        )}
                      </div>
                      {dept.is_reportable && dept.gap_percent !== null && (
                        <div className="flex items-center gap-4">
                          <Progress 
                            value={Math.min(100, Math.abs(dept.gap_percent) * 5)} 
                            className="h-2 flex-1"
                          />
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>♂ {formatCurrency(dept.male_median)}</span>
                            <span>♀ {formatCurrency(dept.female_median)}</span>
                          </div>
                        </div>
                      )}
                      {!dept.is_reportable && (
                        <p className="text-xs text-muted-foreground">{dept.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels" className="mt-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Pay Gap nach Karrierestufe</CardTitle>
              <CardDescription>
                Analyse über alle Job-Level hinweg
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report?.by_level.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  Keine Level-Daten verfügbar
                </div>
              ) : (
                <div className="space-y-4">
                  {report?.by_level.map((level, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{level.level}</span>
                        {level.gap_data?.is_reportable ? (
                          <Badge className={getGapColor(level.gap_data.gap_percent)}>
                            {level.gap_data.gap_percent?.toFixed(1)}% Gap
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Lock className="h-3 w-3 mr-1" />
                            Unterdrückt
                          </Badge>
                        )}
                      </div>
                      {level.gap_data?.is_reportable && level.gap_data.gap_percent !== null && (
                        <div className="flex items-center gap-4">
                          <Progress 
                            value={Math.min(100, Math.abs(level.gap_data.gap_percent) * 5)} 
                            className="h-2 flex-1"
                          />
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>♂ {level.gap_data.male_count}</span>
                            <span>♀ {level.gap_data.female_count}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deviations" className="mt-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Kritische Abweichungen</CardTitle>
              <CardDescription>
                Positionen mit Gehaltsdifferenzen über 20% Schwellenwert
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deviations.length === 0 ? (
                <div className="text-center py-8 text-emerald-600">
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2" />
                  <p>Keine kritischen Abweichungen gefunden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deviations.map((dev, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-lg border ${
                        dev.is_critical 
                          ? 'border-destructive/50 bg-destructive/5' 
                          : 'border-border/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{dev.job_profile_title}</p>
                          <p className="text-sm text-muted-foreground">{dev.job_level_name}</p>
                        </div>
                        <Badge variant={dev.is_critical ? 'destructive' : 'secondary'}>
                          {dev.deviation_percent?.toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-sm mt-2 text-muted-foreground">
                        {dev.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EU Compliance Footer */}
      {report && (
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground text-center">
              {report.eu_compliance_note} • 
              Generiert am {new Date(report.generated_at).toLocaleString('de-DE')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
