'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Building2, ArrowRight, ArrowLeft, CheckCircle2, Shield, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createSupabaseClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PLANS, TRIAL_DURATION_DAYS, TRIAL_TIER, type SubscriptionTier } from '@/lib/subscription';

type OnboardingStep = 1 | 2 | 3;
type UserRole = 'admin' | 'hr_manager';
type CompanySize = '1-50' | '51-250' | '251-1000';

export default function OnboardingPage() {
    const router = useRouter();
    const { user, isLoaded, isSignedIn, organizations, setActiveOrganization, refreshAuth } = useAuth();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
    const [loading, setLoading] = useState(false);

    const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [companySize, setCompanySize] = useState<CompanySize>('1-50');
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('professional');
    const [consultingOption, setConsultingOption] = useState<'self-service' | 'guided'>('self-service');

    // If auth loaded and user already has an org, skip to dashboard
    useEffect(() => {
        if (isLoaded && isSignedIn && organizations.length > 0) {
            router.replace('/dashboard');
        }
    }, [isLoaded, isSignedIn, organizations, router]);

    // Pre-fill name from auth if available
    useEffect(() => {
        if (user?.fullName && !fullName) {
            setFullName(user.fullName);
        }
    }, [user?.fullName, fullName]);

    const totalSteps = 3;
    const progress = (currentStep / totalSteps) * 100;

    const canProceedStep1 = fullName.trim().length > 0;
    const canProceedStep2 = companyName.trim().length > 0;

    // Show loading while auth is initializing
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Konto wird vorbereitet...</p>
                </div>
            </div>
        );
    }

    // If not signed in (broken session or not logged in),
    // redirect to /auth/sign-in (route handler) to bypass middleware and get fresh session
    if (!isSignedIn) {
        window.location.assign('/auth/sign-in');
        return null;
    }

    const handleComplete = async () => {
        if (!user) return;

        setLoading(true);

        try {
            let organization = organizations[0] ?? null;

            if (!organization) {
                const res = await fetch('/api/auth/organizations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: companyName || `${fullName}s Unternehmen` }),
                });
                const data = await res.json();
                if (!res.ok) {
                    // Session broken → force re-authentication
                    if (data.reauth || res.status === 401) {
                        toast({
                            title: 'Sitzung abgelaufen',
                            description: 'Sie werden zur Anmeldung weitergeleitet...',
                            variant: 'destructive',
                        });
                        setTimeout(() => window.location.assign('/auth/sign-in'), 1500);
                        return;
                    }
                    throw new Error(data.error || 'Organisation konnte nicht erstellt werden.');
                }
                organization = data.organization;
            }

            if (!organization) throw new Error('Organisation konnte nicht gefunden werden.');

            await setActiveOrganization(organization.id);
            await refreshAuth();

            const supabase = createSupabaseClient(async () => {
                const res = await fetch('/api/auth/organization-token', { cache: 'no-store' });
                if (!res.ok) return null;
                const data = await res.json();
                return data.token as string | null;
            });

            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

            const { data: existingCompany } = await supabase
                .from('companies')
                .select('id')
                .eq('organization_id', organization.id)
                .maybeSingle();

            let companyId: string;

            // During trial, everyone gets Professional features.
            // selectedPlan is stored in onboarding_data for post-trial conversion.
            const trialTier = TRIAL_TIER;

            if (existingCompany) {
                const { data, error } = await supabase
                    .from('companies')
                    .update({
                        name: companyName,
                        industry,
                        size: companySize,
                        subscription_tier: trialTier,
                        subscription_status: 'trialing',
                        trial_ends_at: trialEndsAt.toISOString(),
                    })
                    .eq('id', existingCompany.id)
                    .select('id')
                    .single();
                if (error) throw error;
                companyId = data.id;
            } else {
                const { data, error } = await supabase
                    .from('companies')
                    .insert({
                        name: companyName,
                        industry,
                        size: companySize,
                        organization_id: organization.id,
                        created_by: user.id,
                        subscription_tier: trialTier,
                        subscription_status: 'trialing',
                        trial_ends_at: trialEndsAt.toISOString(),
                    })
                    .select('id')
                    .single();
                if (error) throw error;
                companyId = data.id;
            }

            await supabase.from('profiles').upsert(
                {
                    user_id: user.id,
                    full_name: fullName,
                    company_name: companyName,
                    organization_id: organization.id,
                },
                { onConflict: 'user_id' }
            );

            const { data: existingRole } = await supabase
                .from('user_roles')
                .select('id')
                .eq('user_id', user.id)
                .eq('organization_id', organization.id)
                .maybeSingle();

            if (!existingRole) {
                const { error: roleError } = await supabase.from('user_roles').insert({
                    user_id: user.id,
                    role: 'admin',
                    organization_id: organization.id,
                });
                if (roleError) console.error('user_roles insert failed:', roleError);
            } else {
                const { error: roleError } = await supabase
                    .from('user_roles')
                    .update({ role: 'admin' })
                    .eq('id', existingRole.id);
                if (roleError) console.error('user_roles update failed:', roleError);
            }

            await supabase.from('onboarding_data').upsert(
                {
                    user_id: user.id,
                    organization_id: organization.id,
                    company_id: companyId,
                    company_size: companySize,
                    selected_plan: selectedPlan,
                    self_reported_role: selectedRole,
                    consulting_option: consultingOption,
                    completed_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
            );

            toast({
                title: 'Willkommen bei KlarGehalt!',
                description: `Ihre ${TRIAL_DURATION_DAYS}-tägige Testphase hat begonnen.`,
            });

            if (selectedPlan === 'enterprise') {
                router.push('/book-consulting');
            } else {
                router.push(consultingOption === 'guided' ? '/book-consulting' : '/dashboard');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.';
            console.error('Onboarding error:', error);
            toast({ title: 'Fehler', description: message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-2xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <Image src="/brandname.svg" alt="KlarGehalt" width={160} height={24} className="h-6 w-auto mx-auto mb-6" />
                    <Progress value={progress} className="h-1.5 mb-2" />
                    <p className="text-xs text-muted-foreground">Schritt {currentStep} von {totalSteps}</p>
                </div>

                {/* Step 1: Role + Name */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">Willkommen bei KlarGehalt</h1>
                            <p className="text-muted-foreground">Lassen Sie uns Ihr Konto einrichten</p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Ihre Rolle</CardTitle>
                                <CardDescription>Wählen Sie Ihre Position im Unternehmen</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                                    <Label htmlFor="r-admin" className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors">
                                        <RadioGroupItem value="admin" id="r-admin" />
                                        <Building2 className="w-5 h-5 text-primary shrink-0" />
                                        <div>
                                            <div className="font-semibold">Geschäftsführer / Admin</div>
                                            <p className="text-sm text-muted-foreground">Voller Zugriff auf alle Funktionen</p>
                                        </div>
                                    </Label>
                                    <Label htmlFor="r-hr" className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors">
                                        <RadioGroupItem value="hr_manager" id="r-hr" />
                                        <Users className="w-5 h-5 text-primary shrink-0" />
                                        <div>
                                            <div className="font-semibold">HR-Manager</div>
                                            <p className="text-sm text-muted-foreground">Mitarbeiter- und Gehaltsverwaltung</p>
                                        </div>
                                    </Label>
                                </RadioGroup>

                                <div className="pt-2">
                                    <Label htmlFor="fullName">Ihr vollständiger Name</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Max Mustermann"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 2: Company Details */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">Ihr Unternehmen</h1>
                            <p className="text-muted-foreground">Grunddaten für die EU-Berichterstattung</p>
                        </div>

                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <Label htmlFor="companyName">Firmenname *</Label>
                                    <Input
                                        id="companyName"
                                        placeholder="Muster GmbH"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="industry">Branche</Label>
                                    <Input
                                        id="industry"
                                        placeholder="z.B. Technologie, Fertigung, Dienstleistung"
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label>Mitarbeiteranzahl</Label>
                                    <RadioGroup value={companySize} onValueChange={(v) => setCompanySize(v as CompanySize)} className="mt-1.5">
                                        {[
                                            { value: '1-50', label: '1–50', desc: 'Basis-Plan empfohlen' },
                                            { value: '51-250', label: '51–250', desc: 'Professional-Plan empfohlen' },
                                            { value: '251-1000', label: '251+', desc: 'Enterprise — Kontakt aufnehmen' },
                                        ].map((opt) => (
                                            <Label key={opt.value} htmlFor={`size-${opt.value}`} className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-secondary transition-colors">
                                                <RadioGroupItem value={opt.value} id={`size-${opt.value}`} />
                                                <div>
                                                    <span className="font-medium">{opt.label} Mitarbeiter</span>
                                                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                                                </div>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Step 3: Plan Selection */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">Ihre {TRIAL_DURATION_DAYS}-tägige Testphase aktivieren</h1>
                            <p className="text-muted-foreground">
                                Sie erhalten Professional kostenlos — wählen Sie Ihren Plan für nach dem Test
                            </p>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Wie möchten Sie starten?</CardTitle>
                                <CardDescription>Beide Optionen sind kostenlos während des Tests</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={consultingOption} onValueChange={(v) => setConsultingOption(v as 'self-service' | 'guided')} className="space-y-2">
                                    <Label htmlFor="opt-self" className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors">
                                        <RadioGroupItem value="self-service" id="opt-self" />
                                        <div>
                                            <div className="font-semibold">Selbst einrichten</div>
                                            <p className="text-sm text-muted-foreground">Guided Checklist im Dashboard — in ca. 20 Minuten startklar</p>
                                        </div>
                                    </Label>
                                    <Label htmlFor="opt-guided" className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors">
                                        <RadioGroupItem value="guided" id="opt-guided" />
                                        <div>
                                            <div className="font-semibold">Kostenloses Einführungsgespräch buchen</div>
                                            <p className="text-sm text-muted-foreground">30 Minuten mit unserem Team — wir richten alles gemeinsam ein</p>
                                        </div>
                                    </Label>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        <div className="grid gap-4">
                            {/* Basis */}
                            <PlanCard
                                tier="basis"
                                selected={selectedPlan === 'basis'}
                                onSelect={() => setSelectedPlan('basis')}
                                recommended={companySize === '1-50'}
                            />
                            {/* Professional */}
                            <PlanCard
                                tier="professional"
                                selected={selectedPlan === 'professional'}
                                onSelect={() => setSelectedPlan('professional')}
                                recommended={companySize === '51-250'}
                                badge="Beliebteste Wahl"
                            />
                            {/* Enterprise */}
                            <Card
                                className={`cursor-pointer transition-all border-2 ${
                                    selectedPlan === 'enterprise'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-transparent hover:border-muted-foreground/20'
                                }`}
                                onClick={() => setSelectedPlan('enterprise')}
                            >
                                <CardContent className="pt-5 pb-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">Enterprise</span>
                                                {companySize === '251-1000' && (
                                                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Empfohlen</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5">250+ Mitarbeiter · SSO · SLA · Dedizierter Ansprechpartner</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-medium">Auf Anfrage</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Security badges */}
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> DSGVO-konform</span>
                            <span>·</span>
                            <span>EU-Server</span>
                            <span>·</span>
                            <span>Jederzeit kündbar</span>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentStep((s) => (s - 1) as OnboardingStep)}
                        disabled={currentStep === 1}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Zurück
                    </Button>

                    {currentStep < 3 ? (
                        <Button
                            onClick={() => setCurrentStep((s) => (s + 1) as OnboardingStep)}
                            disabled={currentStep === 1 ? !canProceedStep1 : !canProceedStep2}
                        >
                            Weiter
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleComplete} disabled={loading}>
                            {loading ? 'Wird eingerichtet...' : selectedPlan === 'enterprise' ? 'Kontakt aufnehmen' : `Kostenlos starten`}
                            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function PlanCard({
    tier,
    selected,
    onSelect,
    recommended,
    badge,
}: {
    tier: SubscriptionTier;
    selected: boolean;
    onSelect: () => void;
    recommended?: boolean;
    badge?: string;
}) {
    const plan = PLANS[tier];

    return (
        <Card
            className={`cursor-pointer transition-all border-2 ${
                selected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent hover:border-muted-foreground/20'
            }`}
            onClick={onSelect}
        >
            <CardContent className="pt-5 pb-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{plan.nameDE}</span>
                            {badge && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    {badge}
                                </span>
                            )}
                            {recommended && !badge && (
                                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Empfohlen</span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                            {plan.features.slice(0, 4).map((f) => (
                                <span key={f} className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="text-right shrink-0 pl-4">
                        <div className="text-2xl font-bold">€{plan.priceMonthly}</div>
                        <div className="text-xs text-muted-foreground">/Monat</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
