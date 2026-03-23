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
import { usePayGapStatistics, DepartmentStatistic, GenderPayGap } from '@/hooks/usePayGapStatistics';
import { usePermissions } from '@/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export function PayGapReportView() {
  const {
    loading,
    getDepartmentStatistics,
    calculateGenderPayGap,
  } = usePayGapStatistics();
  const { hasPermission } = usePermissions();

  const [deptStats, setDeptStats] = useState<DepartmentStatistic[]>([]);
  const [gapData, setGapData] = useState<GenderPayGap[]>([]);

  const canViewReport = hasPermission('reports.view') || hasPermission('audit.view');

  useEffect(() => {
    if (canViewReport) {
      loadData();
    }
  }, [canViewReport]);

  const loadData = async () => {
    const [stats, gaps] = await Promise.all([
      getDepartmentStatistics(),
      calculateGenderPayGap(),
    ]);

    setDeptStats(stats);
    setGapData(gaps);
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

  if (loading && gapData.length === 0) {
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
          <Button variant="default" size="sm" disabled={gapData.length === 0}>
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
          Alle Werte sind aggregiert mit Mindestgruppengröße 5.
          Kleine Gruppen werden automatisch unterdrückt um Rückschlüsse auf Einzelpersonen zu verhindern.
        </AlertDescription>
      </Alert>

      {/* Breach warnings */}
      {gapData.filter(g => g.gap_status === 'breach').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Handlungsbedarf erkannt</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {gapData.filter(g => g.gap_status === 'breach').map((g, i) => (
                <li key={i} className="text-sm">
                  <strong>{g.scope_label || g.scope}</strong>: {g.mean_gap_pct?.toFixed(1)}% Mean Gap
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
              {gapData.length > 0 ? (
                <>
                  {getGapIndicator(gapData[0]?.mean_gap_pct ?? null)}
                  {gapData[0]?.mean_gap_pct?.toFixed(1) ?? '—'}%
                </>
              ) : (
                <span className="text-muted-foreground text-lg">Keine Snapshots</span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Erfasste Mitarbeiter (Abteilungen)</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Users className="h-6 w-6 text-primary" />
              {deptStats.reduce((sum, d) => sum + d.total_employees, 0)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Abteilungen analysiert</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Building2 className="h-6 w-6 text-primary" />
              {deptStats.filter(d => !d.is_suppressed).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              von {deptStats.length} Abteilungen mit
              ausreichender Gruppengröße
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs für Details */}
      <Tabs defaultValue="departments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="departments">Nach Abteilung</TabsTrigger>
          <TabsTrigger value="snapshots">Pay Gap Snapshots</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Mitarbeiter nach Abteilung</CardTitle>
              <CardDescription>
                Geschlechterverteilung pro Abteilung
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deptStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  Keine Abteilungsdaten verfügbar
                </div>
              ) : (
                <div className="space-y-4">
                  {deptStats.map((dept, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{dept.department_name}</span>
                        {dept.is_suppressed ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Lock className="h-3 w-3 mr-1" />
                            Unterdrückt
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {dept.total_employees} MA
                          </Badge>
                        )}
                      </div>
                      {!dept.is_suppressed && (
                        <div className="flex items-center gap-4">
                          <Progress
                            value={dept.total_employees > 0 ? (dept.female_count / dept.total_employees) * 100 : 0}
                            className="h-2 flex-1"
                          />
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>♂ {dept.male_count}</span>
                            <span>♀ {dept.female_count}</span>
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

        <TabsContent value="snapshots" className="mt-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Pay Gap Snapshots</CardTitle>
              <CardDescription>
                Berechnete Pay-Gap-Analysen aus dem Snapshot-System
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gapData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  Keine Snapshots vorhanden. Starten Sie eine Pay-Gap-Analyse.
                </div>
              ) : (
                <div className="space-y-4">
                  {gapData.map((gap, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{gap.scope_label || gap.scope}</span>
                        {gap.is_suppressed ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            <Lock className="h-3 w-3 mr-1" />
                            Unterdrückt
                          </Badge>
                        ) : (
                          <Badge className={getGapColor(gap.mean_gap_pct)}>
                            {gap.mean_gap_pct?.toFixed(1)}% Gap
                          </Badge>
                        )}
                      </div>
                      {!gap.is_suppressed && gap.mean_gap_pct !== null && (
                        <div className="flex items-center gap-4">
                          <Progress
                            value={Math.min(100, Math.abs(gap.mean_gap_pct) * 5)}
                            className="h-2 flex-1"
                          />
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>♂ {gap.male_count}</span>
                            <span>♀ {gap.female_count}</span>
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
      </Tabs>

      {/* EU Compliance Footer */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground text-center">
            Analyse gemäß EU-Richtlinie 2023/970 zur Entgelttransparenz
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
