'use client';

// Trigger deployment check: 2026-02-25T07:51:18
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Building2, CheckCircle2, ArrowRight, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { createClientWithToken } from '@/utils/supabase/client';
import { useSession, useOrganizationList } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';

type OnboardingStep = 1 | 2 | 3 | 4 | 5;
type UserRole = 'admin' | 'hr_manager';
type CompanySize = '1-50' | '51-250' | '251-1000' | '1000+';
type ConsultingOption = 'self-service' | 'guided' | 'full-service';

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { session } = useSession();
    // Fetch existing memberships to avoid "limit exceeded" error
    const { createOrganization, setActive, userMemberships, isLoaded: isOrgListLoaded } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    });
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
    const [loading, setLoading] = useState(false);

    // Form data
    const [role, setRole] = useState<UserRole>('admin');
    const [companySize, setCompanySize] = useState<CompanySize>('1-50');
    const [consultingOption, setConsultingOption] = useState<ConsultingOption>('self-service');
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [fullName, setFullName] = useState('');

    const totalSteps = 5;
    const progress = (currentStep / totalSteps) * 100;

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep((prev) => (prev + 1) as OnboardingStep);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as OnboardingStep);
        }
    };

    const handleComplete = async () => {
        if (!user || !createOrganization || !setActive) {
            toast({
                title: 'Initialisierung...',
                description: 'Bitte warten Sie kurz, bis das System bereit ist.',
            });
            return;
        }

        if (!isOrgListLoaded) {
            toast({
                title: 'Laden...',
                description: 'Organisationsdaten werden noch geladen.',
            });
            return;
        }

        setLoading(true);

        try {
            // STEP 1: Check/Create Organization in Clerk
            // This is the source of truth for our Tenant-Model
            let organization;
            let existingOrgId = null;

            // Check if user is already in an organization
            if (userMemberships.data && userMemberships.data.length > 0) {
                console.log('Using existing organization:', userMemberships.data[0].organization.id);
                organization = userMemberships.data[0].organization;
                existingOrgId = organization.id;
            } else {
                console.log('Creating Clerk Organization...');
                try {
                    organization = await createOrganization({
                        name: companyName || `${fullName}'s Firma`
                    });
                } catch (orgError: any) {
                    console.error("Clerk Create Error:", orgError);
                    // Fallback: Check again if maybe it was created in race condition
                    if (orgError?.errors?.[0]?.code === 'organization_limit_exceeded') {
                        throw new Error("Sie haben bereits die maximale Anzahl an Organisationen erstellt. Bitte kontaktieren Sie den Support.");
                    }
                    throw orgError;
                }
            }

            if (!organization) throw new Error("Organisation konnte in Clerk nicht erstellt/gefunden werden.");

            // STEP 2: Set the new organization as active
            // This updates the local session
            if (existingOrgId !== organization.id || !session?.lastActiveOrganizationId) {
                await setActive({ organization: organization.id });
                console.log('Clerk Org activated');
            }

            // STEP 3: Get the NEW Clerk Token (which now contains the orgId claim)
            // We wait a bit to ensure the session update has propagated
            await new Promise(resolve => setTimeout(resolve, 1500)); // Increased wait time
            const token = await session?.getToken({ template: 'supabase' });

            if (!token) throw new Error("Kein Auth-Token für Datenbank verfügbar.");

            const supabase = createClientWithToken(token);

            // STEP 4: Create Supabase records (IDEMPOTENT / SAFE)

            // 4a. Check existing Company
            const { data: existingCompany } = await supabase
                .from('companies')
                .select('*')
                .eq('organization_id', organization.id)
                .maybeSingle();

            let companyId;

            if (existingCompany) {
                console.log("Updating existing company...");
                const { data: updatedCompany, error: updateError } = await supabase
                    .from('companies')
                    .update({
                        name: companyName,
                        industry,
                        size: companySize,
                        // Don't update created_by to preserve history
                    })
                    .eq('id', existingCompany.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                companyId = updatedCompany.id;
            } else {
                console.log("Creating new company...");
                const { data: newCompany, error: insertError } = await supabase
                    .from('companies')
                    .insert({
                        name: companyName,
                        industry,
                        size: companySize,
                        organization_id: organization.id,
                        created_by: user.id
                    })
                    .select()
                    .single();

                // If RLS blocked it (because role missing), we might have issues.
                // But generally users can insert companies if they don't have one and RLS allows it (see fix policies)
                if (insertError) {
                    // Emergency Fallback: If RLS blocked insert, maybe user has no role yet? 
                    // The RLS policy "Companies: Insert" allows user to insert if authenticated.
                    throw insertError;
                }
                companyId = newCompany.id;
            }


            // 4b. Sync user profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    user_id: user.id,
                    full_name: fullName,
                    company_name: companyName,
                    organization_id: organization.id
                }, { onConflict: 'user_id' });

            if (profileError) console.error('Supabase Profile Error:', profileError);


            // 4c. Set user role (Idempotent)
            // First check if role exists to avoid PK violation if upsert logic is tricky
            const { data: existingRole } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', user.id)
                .eq('organization_id', organization.id)
                .maybeSingle();

            if (!existingRole) {
                const { error: roleError } = await supabase
                    .from('user_roles')
                    .insert({
                        user_id: user.id,
                        role: role,
                        organization_id: organization.id,
                        company_id: companyId,
                    });
                if (roleError) console.error('User Roles Insert Error:', roleError);
            } else {
                // Update role if needed
                const { error: roleError } = await supabase
                    .from('user_roles')
                    .update({
                        role: role,
                        company_id: companyId
                    })
                    .eq('id', existingRole.id);
                if (roleError) console.error('User Roles Update Error:', roleError);
            }


            // 4d. Store onboarding preferences
            const { error: prefsError } = await supabase
                .from('onboarding_data')
                .upsert({
                    user_id: user.id,
                    organization_id: organization.id,
                    company_id: companyId,
                    company_size: companySize,
                    consulting_option: consultingOption,
                    completed_at: new Date().toISOString(),
                }, { onConflict: 'user_id' }); // Assuming one per user

            if (prefsError) console.error('Onboarding Data Error:', prefsError);

            toast({
                title: 'Willkommen bei KlarGehalt!',
                description: 'Ihr Onboarding wurde erfolgreich abgeschlossen.',
            });

            // Brief delay to ensure state is clear before redirect
            setTimeout(() => router.push('/dashboard'), 500);
        } catch (error: any) {
            console.error('Onboarding error detailed:', error);

            let errorMessage = error.message || 'Ein technisches Problem ist aufgetreten.';

            // Helpful translation for common errors
            if (errorMessage.includes('organization_limit_exceeded')) {
                errorMessage = "Sie haben bereits zu viele Organisationen erstellt. Das System verwendet Ihre bestehende Organisation.";
            }

            toast({
                title: 'Fehler beim Abschluss',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };


    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <Logo className="w-16 h-16 mx-auto text-primary" />
                            <h2 className="text-3xl font-bold">Willkommen bei KlarGehalt</h2>
                            <p className="text-muted-foreground">
                                Lassen Sie uns Ihr Konto einrichten
                            </p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Ihre Rolle im Unternehmen</CardTitle>
                                <CardDescription>
                                    Wählen Sie Ihre Position, um die passenden Funktionen freizuschalten
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
                                    <div className="space-y-3">
                                        <Label
                                            htmlFor="admin"
                                            className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors"
                                        >
                                            <RadioGroupItem value="admin" id="admin" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-5 h-5 text-primary" />
                                                    <span className="font-semibold">Geschäftsführer</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Voller Zugriff auf alle Funktionen und Einstellungen
                                                </p>
                                            </div>
                                        </Label>

                                        <Label
                                            htmlFor="hr_manager"
                                            className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors"
                                        >
                                            <RadioGroupItem value="hr_manager" id="hr_manager" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-5 h-5 text-primary" />
                                                    <span className="font-semibold">HR-Manager</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Verwaltung von Mitarbeitern und Gehaltsbändern
                                                </p>
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <Users className="w-16 h-16 mx-auto text-primary" />
                            <h2 className="text-3xl font-bold">Unternehmensgröße</h2>
                            <p className="text-muted-foreground">
                                Wie viele Mitarbeiter beschäftigt Ihr Unternehmen?
                            </p>
                        </div>

                        <Card>
                            <CardContent className="pt-6">
                                <RadioGroup value={companySize} onValueChange={(value) => setCompanySize(value as CompanySize)}>
                                    <div className="space-y-3">
                                        {[
                                            { value: '1-50', label: '1-50 Mitarbeiter', description: 'Kleine Unternehmen' },
                                            { value: '51-250', label: '51-250 Mitarbeiter', description: 'Mittelständische Unternehmen' },
                                            { value: '251-1000', label: '251-1.000 Mitarbeiter', description: 'Große Unternehmen' },
                                            { value: '1000+', label: 'Mehr als 1.000', description: 'Konzerne' },
                                        ].map((option) => (
                                            <Label
                                                key={option.value}
                                                htmlFor={option.value}
                                                className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors"
                                            >
                                                <RadioGroupItem value={option.value} id={option.value} />
                                                <div className="flex-1">
                                                    <span className="font-semibold">{option.label}</span>
                                                    <p className="text-sm text-muted-foreground">{option.description}</p>
                                                </div>
                                            </Label>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <FileText className="w-16 h-16 mx-auto text-primary" />
                            <h2 className="text-3xl font-bold">Beratung & Vorbereitung</h2>
                            <p className="text-muted-foreground">
                                Wie möchten Sie die EU-Entgelttransparenzrichtlinie umsetzen?
                            </p>
                        </div>

                        <Card>
                            <CardContent className="pt-6">
                                <RadioGroup value={consultingOption} onValueChange={(value) => setConsultingOption(value as ConsultingOption)}>
                                    <div className="space-y-3">
                                        <Label
                                            htmlFor="self-service"
                                            className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors"
                                        >
                                            <RadioGroupItem value="self-service" id="self-service" className="mt-1" />
                                            <div className="flex-1">
                                                <div className="font-semibold">Selbstständig</div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Nutzen Sie unsere Plattform eigenständig mit Hilfe-Center und Dokumentation
                                                </p>
                                                <div className="mt-2 text-sm text-primary font-medium">Kostenlos</div>
                                            </div>
                                        </Label>

                                        <Label
                                            htmlFor="guided"
                                            className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors"
                                        >
                                            <RadioGroupItem value="guided" id="guided" className="mt-1" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">Geführtes Onboarding</span>
                                                    <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">Empfohlen</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Schritt-für-Schritt Anleitung mit Video-Tutorials und E-Mail-Support
                                                </p>
                                                <div className="mt-2 text-sm text-primary font-medium">Inklusive im Standard-Plan</div>
                                            </div>
                                        </Label>

                                        <Label
                                            htmlFor="full-service"
                                            className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors"
                                        >
                                            <RadioGroupItem value="full-service" id="full-service" className="mt-1" />
                                            <div className="flex-1">
                                                <div className="font-semibold">Full-Service Beratung</div>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Persönlicher Berater hilft bei der Strukturierung und Umsetzung
                                                </p>
                                                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-status-success" />
                                                        Persönlicher Compliance-Berater
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-status-success" />
                                                        Individuelle Workshops
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-status-success" />
                                                        Prioritäts-Support
                                                    </li>
                                                </ul>
                                                <div className="mt-2 text-sm text-primary font-medium">Ab 499€/Monat</div>
                                            </div>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {consultingOption === 'full-service' && (
                            <Card className="border-accent">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Beratungstermin vereinbaren
                                    </CardTitle>
                                    <CardDescription>
                                        Unser Team meldet sich innerhalb von 24 Stunden bei Ihnen
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.push('/book-consulting')}
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Termin anfragen
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <Building2 className="w-16 h-16 mx-auto text-primary" />
                            <h2 className="text-3xl font-bold">Unternehmensdaten</h2>
                            <p className="text-muted-foreground">
                                Vervollständigen Sie Ihr Profil
                            </p>
                        </div>

                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Ihr vollständiger Name</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Max Mustermann"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Firmenname</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="Musterfirma GmbH"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="industry">Branche</Label>
                                    <Input
                                        id="industry"
                                        placeholder="z.B. IT, Handel, Produktion"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <CheckCircle2 className="w-16 h-16 mx-auto text-status-success" />
                            <h2 className="text-3xl font-bold">Fast geschafft!</h2>
                            <p className="text-muted-foreground">
                                Überprüfen Sie Ihre Angaben
                            </p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Zusammenfassung</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Rolle</p>
                                        <p className="font-medium">
                                            {role === 'admin' ? 'Geschäftsführer' : 'HR-Manager'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Mitarbeiteranzahl</p>
                                        <p className="font-medium">{companySize}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Beratung</p>
                                        <p className="font-medium">
                                            {consultingOption === 'self-service' && 'Selbstständig'}
                                            {consultingOption === 'guided' && 'Geführt'}
                                            {consultingOption === 'full-service' && 'Full-Service'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Firma</p>
                                        <p className="font-medium">{companyName || '-'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-accent/5 border-accent">
                            <CardHeader>
                                <CardTitle>Nächste Schritte</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5" />
                                        <div>
                                            <p className="font-medium">Gehaltsbänder definieren</p>
                                            <p className="text-sm text-muted-foreground">
                                                Legen Sie Ihre Gehaltsstrukturen fest
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5" />
                                        <div>
                                            <p className="font-medium">Mitarbeiter hinzufügen</p>
                                            <p className="text-sm text-muted-foreground">
                                                Importieren oder manuell anlegen
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5" />
                                        <div>
                                            <p className="font-medium">Mitarbeiter einladen</p>
                                            <p className="text-sm text-muted-foreground">
                                                Geben Sie Ihren Mitarbeitern Zugriff
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return role !== null;
            case 2:
                return companySize !== null;
            case 3:
                return consultingOption !== null;
            case 4:
                return fullName && companyName && industry;
            case 5:
                return true;
            default:
                return false;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Logo className="w-6 h-6 text-primary" />
                            <span className="text-lg font-bold lowercase tracking-tight">klargehalt</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                                Schritt {currentStep} von {totalSteps}
                            </div>
                        </div>
                    </div>
                    <Progress value={progress} className="mt-4" />
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12 max-w-3xl">
                {renderStep()}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Zurück
                        </Button>
                    </div>

                    {currentStep < totalSteps ? (
                        <Button
                            onClick={handleNext}
                            disabled={!canProceed()}
                        >
                            Weiter
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleComplete}
                            disabled={!canProceed() || loading}
                        >
                            {loading ? 'Wird gespeichert...' : 'Abschließen'}
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
