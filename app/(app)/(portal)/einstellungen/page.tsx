'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, FileUp } from 'lucide-react';
import CompanySettingsView from '@/components/dashboard/CompanySettingsView';
import AccountSettingsView from '@/components/dashboard/AccountSettingsView';
import PrivacySettingsView from '@/components/dashboard/PrivacySettingsView';
import { useRoleAccess } from '@/components/RoleGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EinstellungenPage() {
    // Personal "Mein Konto" is available to every portal role.
    // Company + privacy tabs are admin/owner only (real enforcement: RLS).
    const isAdmin = useRoleAccess('admin');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">
                    Einstellungen
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Ihr Konto, Ihr Unternehmen und Datenschutz an einem Ort.
                </p>
            </div>

            <Tabs defaultValue="konto" className="w-full">
                <TabsList>
                    <TabsTrigger value="konto">Mein Konto</TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="unternehmen">
                            Unternehmen
                        </TabsTrigger>
                    )}
                    {isAdmin && (
                        <TabsTrigger value="datenschutz">
                            Datenschutz
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="konto" className="mt-6">
                    <AccountSettingsView />
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="unternehmen" className="mt-6">
                        <div className="space-y-8">
                            <CompanySettingsView />
                            <DataMigrationCard />
                        </div>
                    </TabsContent>
                )}

                {isAdmin && (
                    <TabsContent value="datenschutz" className="mt-6">
                        <PrivacySettingsView />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

function DataMigrationCard() {
    return (
        <Card className="border-slate-200">
            <CardHeader>
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileUp className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Daten-Migration</CardTitle>
                        <CardDescription className="mt-0.5">
                            Erstimport von Mitarbeiterdaten aus einer CSV-Datei mit KI-gestützter
                            Spaltenzuordnung.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                        <div className="text-sm text-amber-900">
                            <p className="font-medium">Nur für den Erstimport gedacht</p>
                            <p className="mt-1 text-amber-800">
                                Für laufende Änderungen — neue Mitarbeiter, Gehaltsanpassungen,
                                Beförderungen — nutze bitte die Mitarbeiterverwaltung im
                                Portal. Nur dort entstehen die für die EU-Richtlinie nötigen
                                Begründungs-Einträge (Decision Documentation).
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">
                        Lädt eine CSV-Datei und ordnet die Spalten KI-gestützt deinen
                        klargehalt-Feldern zu. Plan-Limits und Pflichtfelder werden geprüft.
                    </p>
                    <Link href="/einrichtung/mitarbeiter">
                        <Button variant="default" size="sm">
                            Daten-Migration öffnen
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
