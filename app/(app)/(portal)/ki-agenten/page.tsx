'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { RoleGuard } from '@/components/RoleGuard';
import AccessDenied from '@/components/dashboard/AccessDenied';
import {
    Bot, FileSearch, ShieldCheck, FileText, TrendingUp,
    Lock, Sparkles, Zap, Clock, ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AgentCard {
    icon: React.ElementType;
    title: string;
    description: string;
    status: 'active' | 'beta' | 'soon';
    tag?: string;
}

const AGENTS: AgentCard[] = [
    {
        icon: FileSearch,
        title: 'Gehaltsanalyse-Agent',
        description: 'Scannt automatisch alle Gehaltsdaten auf Ausreißer, Inkonsistenzen und potenzielle Gleichstellungslücken — mit KI-Begründung pro Befund.',
        status: 'active',
        tag: 'Neu',
    },
    {
        icon: FileText,
        title: 'Dokumentations-Agent',
        description: 'Generiert rechtlich fundierte Begründungstexte für Gehaltsänderungen auf Basis der hinterlegten Faktoren und EU-Richtlinie 2023/970.',
        status: 'active',
    },
    {
        icon: ShieldCheck,
        title: 'Compliance-Check-Agent',
        description: 'Prüft jede neue Gehaltsentscheidung vor der Freigabe auf Konformität mit Gehaltsbändern, Karrierestufen und bestehenden Entscheidungen.',
        status: 'beta',
        tag: 'Beta',
    },
    {
        icon: TrendingUp,
        title: 'Bericht-Agent',
        description: 'Erstellt automatisch quartalsmäßige Compliance-Berichte und Zusammenfassungen für Management, Betriebsrat und externe Prüfer.',
        status: 'soon',
    },
    {
        icon: Bot,
        title: 'Anfragen-Agent',
        description: 'Beantwortet eingehende Auskunftsersuchen von Mitarbeitenden automatisch auf Basis der hinterlegten Vergütungsstruktur.',
        status: 'soon',
    },
    {
        icon: Zap,
        title: 'Eskalations-Agent',
        description: 'Erkennt kritische Compliance-Risiken frühzeitig und leitet diese automatisch an zuständige HR-Verantwortliche oder Anwälte weiter.',
        status: 'soon',
    },
];

const STATUS_CONFIG = {
    active: { label: 'Aktiv', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    beta:   { label: 'Beta',  className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    soon:   { label: 'Bald',  className: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

function TrialLockedOverlay() {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-sm p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-amber-400/10 flex items-center justify-center mb-4">
                <Lock className="h-7 w-7 text-amber-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Nicht im Testzeitraum verfügbar</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm">
                KI-Agenten sind ab dem Basis-Plan verfügbar. Buche jetzt und nutze alle Automatisierungen sofort.
            </p>
            <Link href="/abrechnung">
                <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold gap-2">
                    <Sparkles className="h-4 w-4" />
                    Jetzt upgraden
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </Link>
        </div>
    );
}

function KiAgentenContent() {
    const { isTrialing } = useSubscription();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-600/10 pointer-events-none" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">KI-Agenten</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Compliance-Automatisierung mit KI
                    </h1>
                    <p className="text-slate-400 max-w-2xl">
                        Autonome Agenten übernehmen wiederkehrende Compliance-Aufgaben — von der Gehaltsanalyse bis zur Dokumentation. Vollständig auf die EU-Entgelttransparenzrichtlinie ausgerichtet.
                    </p>
                    {isTrialing && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-400/10 border border-amber-400/20 px-3 py-2">
                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                            <span className="text-xs text-amber-300 font-medium">Im Testzeitraum nicht verfügbar — ab Basis-Plan freigeschaltet</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Agent Grid */}
            <div className={`relative ${isTrialing ? 'select-none' : ''}`}>
                {isTrialing && <TrialLockedOverlay />}
                <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${isTrialing ? 'opacity-30 pointer-events-none' : ''}`}>
                    {AGENTS.map((agent) => {
                        const statusCfg = STATUS_CONFIG[agent.status];
                        const isSoon = agent.status === 'soon';
                        return (
                            <div
                                key={agent.title}
                                className={`group relative flex flex-col rounded-xl border bg-white p-6 shadow-sm transition-all duration-200 ${
                                    isSoon
                                        ? 'border-slate-200 opacity-60'
                                        : 'border-slate-200 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                        isSoon ? 'bg-slate-100' : 'bg-primary/10 group-hover:bg-primary/15 transition-colors'
                                    }`}>
                                        {isSoon
                                            ? <Clock className="h-5 w-5 text-slate-400" />
                                            : <agent.icon className="h-5 w-5 text-primary" />
                                        }
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {agent.tag && (
                                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                {agent.tag}
                                            </span>
                                        )}
                                        <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${statusCfg.className}`}>
                                            {statusCfg.label}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-2 text-[15px]">{agent.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed flex-1">{agent.description}</p>
                                {!isSoon && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                                            Agent starten <ArrowRight className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-slate-400">
                KI-Agenten operieren ausschließlich auf Ihren Unternehmensdaten — keine Weitergabe an Dritte.
            </p>
        </div>
    );
}

export default function KiAgentenPage() {
    return (
        <RoleGuard roles={['admin', 'hr_manager']} fallback={<AccessDenied />}>
            <KiAgentenContent />
        </RoleGuard>
    );
}
