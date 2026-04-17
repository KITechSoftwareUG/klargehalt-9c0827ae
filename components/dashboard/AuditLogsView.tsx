import { useState, useEffect } from 'react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import type { AuditLog } from '@/hooks/useAuditLogs';
import { useAuditSystem } from '@/hooks/useAuditSystem';
import type { AuditStatistics } from '@/hooks/useAuditSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Filter,
  Eye,
  FileText,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  FileSearch,
  Shield,
  RefreshCw,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Link2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const actionLabels: Record<string, string> = {
  create: 'Erstellt',
  update: 'Aktualisiert',
  delete: 'Gelöscht',
  view: 'Angesehen',
  export: 'Exportiert',
  login: 'Angemeldet',
  logout: 'Abgemeldet',
  request_info: 'Anfrage gestellt',
};

const actionIcons: Record<string, React.ElementType> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  view: Eye,
  export: Download,
  login: LogIn,
  logout: LogOut,
  request_info: FileSearch,
};

const entityLabels: Record<string, string> = {
  job_profile: 'Job-Profil',
  pay_band: 'Gehaltsband',
  employee: 'Mitarbeiter',
  info_request: 'Auskunftsanfrage',
  user: 'Benutzer',
  company: 'Firma',
  report: 'Bericht',
  department: 'Abteilung',
  job_level: 'Karrierestufe',
};

const actionColors: Record<string, string> = {
  create: 'bg-status-ok/10 text-status-ok',
  update: 'bg-status-warning/10 text-status-warning',
  delete: 'bg-destructive/10 text-destructive',
  view: 'bg-muted text-muted-foreground',
  export: 'bg-primary/10 text-primary',
  login: 'bg-status-ok/10 text-status-ok',
  logout: 'bg-muted text-muted-foreground',
  request_info: 'bg-primary/10 text-primary',
};

const AuditLogsView = () => {
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    user_id: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [stats, setStats] = useState<AuditStatistics | null>(null);
  const [activeTab, setActiveTab] = useState('logs');

  const [chainStatus, setChainStatus] = useState<'idle' | 'checking' | 'pass' | 'fail'>('idle');

  const { auditLogs, loading, totalCount, verifyChain } = useAuditLogs(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  );

  const {
    loading: systemLoading,
    getStatistics,
    createExport,
    downloadExport
  } = useAuditSystem();

  useEffect(() => {
    if (activeTab === 'statistics') {
      getStatistics(30).then(setStats);
    }
  }, [activeTab, getStatistics]);

  const handleExportJson = async () => {
    const result = await createExport('full', 'json');
    if (result) {
      downloadExport(result, 'json');
    }
  };

  const handleExportCsv = async () => {
    const result = await createExport('full', 'csv');
    if (result) {
      downloadExport(result, 'csv');
    }
  };

  const handleVerifyChain = async () => {
    setChainStatus('checking');
    const result = await verifyChain();
    if (result === null) {
      setChainStatus('idle');
      return;
    }
    if (result) {
      setChainStatus('pass');
      toast.success('Hash-Kette intakt — keine Manipulationen erkannt.');
    } else {
      setChainStatus('fail');
      toast.error('Hash-Kette unterbrochen — mögliche Manipulation erkannt!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && auditLogs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Audit-System
          </h2>
          <p className="text-muted-foreground">
            Revisionssichere Protokollierung ({totalCount} Einträge)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={chainStatus === 'pass' ? 'outline' : chainStatus === 'fail' ? 'destructive' : 'outline'}
            size="sm"
            onClick={handleVerifyChain}
            disabled={chainStatus === 'checking'}
          >
            {chainStatus === 'checking' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : chainStatus === 'pass' ? (
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
            ) : chainStatus === 'fail' ? (
              <XCircle className="w-4 h-4 mr-2" />
            ) : (
              <Link2 className="w-4 h-4 mr-2" />
            )}
            {chainStatus === 'checking' ? 'Prüfe...' : chainStatus === 'pass' ? 'Kette intakt' : chainStatus === 'fail' ? 'Kette unterbrochen' : 'Integritätsprüfung'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson} disabled={systemLoading}>
            <FileJson className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button variant="default" size="sm" onClick={handleExportCsv} disabled={systemLoading}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs">Protokoll</TabsTrigger>
          <TabsTrigger value="statistics">Statistiken</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4 space-y-4">
          {/* Filter Button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              Filter {showFilters ? 'ausblenden' : 'anzeigen'}
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="p-4 border border-border rounded-xl bg-card space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Aktion</Label>
                  <Select
                    value={filters.action}
                    onValueChange={(value) => setFilters({ ...filters, action: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle</SelectItem>
                      <SelectItem value="create">Erstellt</SelectItem>
                      <SelectItem value="update">Aktualisiert</SelectItem>
                      <SelectItem value="delete">Gelöscht</SelectItem>
                      <SelectItem value="view">Angesehen</SelectItem>
                      <SelectItem value="export">Exportiert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entität</Label>
                  <Select
                    value={filters.entity_type}
                    onValueChange={(value) => setFilters({ ...filters, entity_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle</SelectItem>
                      <SelectItem value="job_profile">Job-Profil</SelectItem>
                      <SelectItem value="pay_band">Gehaltsband</SelectItem>
                      <SelectItem value="employee">Mitarbeiter</SelectItem>
                      <SelectItem value="department">Abteilung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Benutzer-ID</Label>
                  <Input
                    placeholder="User-ID suchen..."
                    value={filters.user_id}
                    onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Von</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bis</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ action: '', entity_type: '', user_id: '', dateFrom: '', dateTo: '' })}
                >
                  Filter zurücksetzen
                </Button>
              </div>
            </div>
          )}

          {auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Keine Audit-Logs vorhanden</h3>
              <p className="text-muted-foreground text-center">
                Änderungen an Daten werden hier automatisch protokolliert.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Aktion</TableHead>
                    <TableHead>Entität</TableHead>
                    <TableHead>Entitäts-ID</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => {
                    const ActionIcon = actionIcons[log.action] || FileText;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-xs text-muted-foreground truncate max-w-[120px]" title={log.user_id}>
                            {log.user_id}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || ''}`}>
                            <ActionIcon className="w-3 h-3" />
                            {actionLabels[log.action] || log.action}
                          </span>
                        </TableCell>
                        <TableCell>{entityLabels[log.entity_type] || log.entity_type}</TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-[100px]" title={log.entity_id || ''}>
                          {log.entity_id ? log.entity_id.substring(0, 8) + '...' : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          {stats ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardDescription>Gesamt (30 Tage)</CardDescription>
                    <CardTitle className="text-3xl">{stats.total_records}</CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardDescription>Aktionen</CardDescription>
                    <CardTitle className="text-xl">
                      {Object.keys(stats.records_by_action || {}).length} Typen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(stats.records_by_action || {}).map(([action, count]) => (
                        <Badge key={action} variant="outline" className="text-xs">
                          {actionLabels[action] || action}: {count as number}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardDescription>Entitäten</CardDescription>
                    <CardTitle className="text-xl">
                      {Object.keys(stats.records_by_entity || {}).length} Typen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(stats.records_by_entity || {}).map(([entity, count]) => (
                        <Badge key={entity} variant="outline" className="text-xs">
                          {entityLabels[entity] || entity}: {count as number}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {stats.daily_activity && stats.daily_activity.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Tägliche Aktivität</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.daily_activity.slice(-7).map((day) => (
                        <div key={day.date} className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground w-24">
                            {new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                          </span>
                          <Progress
                            value={Math.min(100, (day.count / Math.max(...stats.daily_activity.map(d => d.count))) * 100)}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm font-medium w-12 text-right">{day.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit-Log Details</DialogTitle>
            <DialogDescription>
              Vollständige Informationen zum Protokolleintrag
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Zeitpunkt</Label>
                  <p className="font-mono">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Benutzer-ID</Label>
                  <p className="font-mono text-sm break-all">{selectedLog.user_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Aktion</Label>
                  <p>{actionLabels[selectedLog.action] || selectedLog.action}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entitätstyp</Label>
                  <p>{entityLabels[selectedLog.entity_type] || selectedLog.entity_type}</p>
                </div>
                {selectedLog.entity_id && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Entitäts-ID</Label>
                    <p className="font-mono text-sm">{selectedLog.entity_id}</p>
                  </div>
                )}
                {selectedLog.ip_address && (
                  <div>
                    <Label className="text-muted-foreground">IP-Adresse</Label>
                    <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              {selectedLog.before_state && (
                <div>
                  <Label className="text-muted-foreground">Vorheriger Zustand</Label>
                  <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.before_state, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after_state && (
                <div>
                  <Label className="text-muted-foreground">Neuer Zustand</Label>
                  <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.after_state, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsView;
