import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Users,
  GraduationCap,
  Send,
  ShieldCheck,
  Calendar,
  Lock
} from 'lucide-react';
import { useInfoRequests, REQUEST_TYPES, InfoRequestType, InfoRequest, InfoRequestResponse } from '@/hooks/useInfoRequests';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const ICON_MAP: Record<string, React.ElementType> = {
  BarChart3,
  FileText,
  TrendingUp,
  Users,
  GraduationCap
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  submitted: { color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', icon: Clock },
  validating: { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: Clock },
  processing: { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: Clock },
  ready: { color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
  viewed: { color: 'bg-muted text-muted-foreground', icon: Eye },
  rejected: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
  expired: { color: 'bg-muted text-muted-foreground', icon: AlertTriangle },
  cancelled: { color: 'bg-muted text-muted-foreground', icon: XCircle }
};

export function InfoRequestsView() {
  const { requests, loading, rateLimits, submitRequest, getResponse } = useInfoRequests();
  const [selectedType, setSelectedType] = useState<InfoRequestType | null>(null);
  const [responseData, setResponseData] = useState<InfoRequestResponse | null>(null);
  const [viewingRequest, setViewingRequest] = useState<InfoRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (type: InfoRequestType) => {
    setSubmitting(true);
    const success = await submitRequest(type);
    if (success) {
      setSelectedType(null);
    }
    setSubmitting(false);
  };

  const handleViewResponse = async (request: InfoRequest) => {
    setViewingRequest(request);
    const response = await getResponse(request.id);
    setResponseData(response);
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const renderResponseContent = (response: InfoRequestResponse) => {
    const data = response.response_data;
    
    if (!data) {
      return <p className="text-muted-foreground">Keine Daten verfügbar.</p>;
    }

    switch (response.request_type) {
      case 'salary_band_position':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Job-Profil</p>
                <p className="font-medium">{data.job_profile}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="font-medium">{data.job_level}</p>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-2">Ihre Position im Entgeltband</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(data.quartile || 1) * 25}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>{formatCurrency(data.band_min)}</span>
                    <span>{formatCurrency(data.band_median)} (Median)</span>
                    <span>{formatCurrency(data.band_max)}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Q{data.quartile}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {data.employees_in_band} Mitarbeiter in diesem Entgeltband
            </p>
          </div>
        );

      case 'salary_criteria':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Job-Profil</p>
                <p className="font-medium">{data.job_profile}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="font-medium">{data.job_level}</p>
              </div>
            </div>
            
            {data.criteria && (
              <div className="space-y-3">
                <h4 className="font-medium">Kriterien für die Gehaltseinstufung:</h4>
                <ul className="space-y-2">
                  {data.criteria.min_experience_years && (
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Mindestens {data.criteria.min_experience_years} Jahre Berufserfahrung
                    </li>
                  )}
                  {data.criteria.education_level && (
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Bildungsniveau: {data.criteria.education_level}
                    </li>
                  )}
                  {data.criteria.required_qualifications && (
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {data.criteria.required_qualifications}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        );

      case 'career_progression':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">Aktuelles Level</p>
              <p className="font-medium text-lg">{data.current_level}</p>
            </div>
            
            {data.next_levels && data.next_levels.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-medium">Nächste Karrierestufen:</h4>
                {data.next_levels.map((level: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg border border-border/50 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{level.name}</span>
                      {level.pay_band_increase && (
                        <Badge variant="outline" className="text-emerald-600">
                          +{formatCurrency(level.pay_band_increase)}
                        </Badge>
                      )}
                    </div>
                    {level.min_experience && (
                      <p className="text-sm text-muted-foreground">
                        Ab {level.min_experience} Jahren Erfahrung
                      </p>
                    )}
                    {level.description && (
                      <p className="text-sm mt-1">{level.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Keine weiteren Levels definiert.</p>
            )}
          </div>
        );

      case 'pay_gap_category':
        return (
          <div className="space-y-4">
            {data.is_reportable ? (
              <>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Gender Pay Gap in Ihrer Kategorie</p>
                  <p className="text-3xl font-bold">
                    {data.gap_percent?.toFixed(1)}%
                  </p>
                </div>
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>
                    Dieser Wert basiert auf anonymisierten, aggregierten Daten und entspricht 
                    den Anforderungen der EU-Richtlinie 2023/970.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertTitle>Daten nicht verfügbar</AlertTitle>
                <AlertDescription>
                  {data.reason || 'Für Ihre Kategorie liegen nicht ausreichend Daten vor, um anonymisierte Statistiken zu erstellen.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'qualification_requirements':
        return (
          <div className="space-y-4">
            {data.current_qualifications && (
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Aktuelle Anforderungen:</h4>
                <ul className="space-y-1 text-sm">
                  {data.current_qualifications.education_level && (
                    <li>• Bildung: {data.current_qualifications.education_level}</li>
                  )}
                  {data.current_qualifications.min_experience && (
                    <li>• Erfahrung: {data.current_qualifications.min_experience} Jahre</li>
                  )}
                </ul>
              </div>
            )}
            
            {data.next_level_requirements && data.next_level_requirements.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Anforderungen für höhere Levels:</h4>
                {data.next_level_requirements.map((req: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg border border-border/50">
                    <p className="font-medium">{req.level_name}</p>
                    {req.min_experience && (
                      <p className="text-sm text-muted-foreground">
                        Mindestens {req.min_experience} Jahre Erfahrung
                      </p>
                    )}
                    {req.typical_qualifications && (
                      <p className="text-sm mt-1">{req.typical_qualifications}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Auskunftsanfragen
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Stellen Sie Anfragen zu Ihrer Vergütung gemäß EU-Richtlinie 2023/970
        </p>
      </div>

      {/* Hinweis */}
      <Alert className="border-primary/30 bg-primary/5">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Rechtlich garantierte Auskunft</AlertTitle>
        <AlertDescription>
          Sie haben das Recht auf Auskunft über die Kriterien Ihrer Gehaltseinstufung. 
          Alle Daten werden anonymisiert und entsprechen den EU-Vorgaben. 
          Maximal 3 Anfragen pro Typ und Monat möglich.
        </AlertDescription>
      </Alert>

      {/* Anfrage-Typen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(Object.entries(REQUEST_TYPES) as [InfoRequestType, typeof REQUEST_TYPES[InfoRequestType]][]).map(([type, config]) => {
          const Icon = ICON_MAP[config.icon] || FileText;
          const limit = rateLimits[type];
          const canRequest = !limit || limit.allowed;
          
          return (
            <Card 
              key={type} 
              className={`border-border/50 transition-all ${canRequest ? 'hover:border-primary/50 cursor-pointer' : 'opacity-60'}`}
              onClick={() => canRequest && setSelectedType(type)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  {limit && (
                    <Badge variant="outline" className="text-xs">
                      {limit.current_count}/{limit.max_allowed} genutzt
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base mt-3">{config.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {config.description}
                </CardDescription>
                {!canRequest && limit && (
                  <p className="text-xs text-destructive mt-2">
                    Limit erreicht. Reset: {new Date(limit.next_reset).toLocaleDateString('de-DE')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Meine Anfragen */}
      {requests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Meine Anfragen</h3>
          <div className="space-y-3">
            {requests.map(request => {
              const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.submitted;
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={request.id} className="border-border/50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{request.request_type_label}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(request.submitted_at), { addSuffix: true, locale: de })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusConfig.color}>
                          {request.status_label}
                        </Badge>
                        {request.has_response && (request.status === 'ready' || request.status === 'viewed') && (
                          <Button 
                            size="sm" 
                            variant={request.status === 'ready' ? 'default' : 'outline'}
                            onClick={() => handleViewResponse(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {request.status === 'ready' ? 'Antwort ansehen' : 'Erneut ansehen'}
                          </Button>
                        )}
                      </div>
                    </div>
                    {request.rejection_reason && (
                      <p className="text-sm text-destructive mt-2">
                        Abgelehnt: {request.rejection_reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Bestätigungs-Dialog */}
      <Dialog open={selectedType !== null} onOpenChange={() => setSelectedType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auskunftsanfrage bestätigen</DialogTitle>
            <DialogDescription>
              Möchten Sie eine Anfrage vom Typ "{selectedType && REQUEST_TYPES[selectedType].label}" stellen?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Die Antwort wird in der Regel innerhalb von 24 Stunden bereitgestellt 
                und ist 30 Tage lang abrufbar.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedType(null)}>
                Abbrechen
              </Button>
              <Button 
                onClick={() => selectedType && handleSubmit(selectedType)}
                disabled={submitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Wird eingereicht...' : 'Anfrage stellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Antwort-Dialog */}
      <Dialog open={viewingRequest !== null} onOpenChange={() => { setViewingRequest(null); setResponseData(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{responseData?.request_type_label || 'Antwort'}</DialogTitle>
            <DialogDescription>
              {responseData?.anonymization_note}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            {responseData ? (
              renderResponseContent(responseData)
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>
          {responseData?.expires_at && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Gültig bis: {new Date(responseData.expires_at).toLocaleDateString('de-DE')}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
