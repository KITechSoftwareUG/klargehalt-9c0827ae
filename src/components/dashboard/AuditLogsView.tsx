import { useState } from 'react';
import { useAuditLogs, AuditLog } from '@/hooks/useAuditLogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Shield
} from 'lucide-react';

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
  salary_component: 'Gehaltskomponente',
  employee: 'Mitarbeiter',
  salary_info: 'Gehaltsdaten',
  info_request: 'Auskunftsanfrage',
  user: 'Benutzer',
  company: 'Firma',
  report: 'Bericht',
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
    user_email: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  const { auditLogs, loading, totalCount, exportAuditLogs } = useAuditLogs(
    Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
  );

  const handleExport = async () => {
    await exportAuditLogs('csv');
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

  if (loading) {
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
          <h2 className="text-2xl font-bold text-foreground">Audit-Logs</h2>
          <p className="text-muted-foreground">
            Revisionssichere Protokollierung aller Änderungen ({totalCount} Einträge)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="hero" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            CSV Export
          </Button>
        </div>
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
                  <SelectItem value="salary_info">Gehaltsdaten</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Benutzer</Label>
              <Input
                placeholder="E-Mail suchen..."
                value={filters.user_email}
                onChange={(e) => setFilters({ ...filters, user_email: e.target.value })}
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
              onClick={() => setFilters({ action: '', entity_type: '', user_email: '', dateFrom: '', dateTo: '' })}
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
                <TableHead>Name</TableHead>
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
                      <div>
                        <p className="font-medium text-sm">{log.user_email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{log.user_role}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action]}`}>
                        <ActionIcon className="w-3 h-3" />
                        {actionLabels[log.action]}
                      </span>
                    </TableCell>
                    <TableCell>{entityLabels[log.entity_type]}</TableCell>
                    <TableCell className="font-medium">{log.entity_name || '—'}</TableCell>
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
                  <Label className="text-muted-foreground">Benutzer</Label>
                  <p>{selectedLog.user_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Rolle</Label>
                  <p className="capitalize">{selectedLog.user_role}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Aktion</Label>
                  <p>{actionLabels[selectedLog.action]}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Hash (Manipulationsschutz)</Label>
                <p className="font-mono text-xs break-all bg-muted p-2 rounded mt-1">
                  {selectedLog.record_hash}
                </p>
              </div>

              {selectedLog.old_values && (
                <div>
                  <Label className="text-muted-foreground">Alte Werte</Label>
                  <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <Label className="text-muted-foreground">Neue Werte</Label>
                  <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
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
