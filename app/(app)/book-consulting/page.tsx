'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createClientWithToken } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@clerk/nextjs';
import { Calendar as CalendarIcon, Clock, Video, Phone, MapPin, CheckCircle2, ArrowLeft, User, Mail, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type ConsultationType = 'video' | 'phone' | 'in-person';
type TimeSlot = '09:00' | '10:00' | '11:00' | '13:00' | '14:00' | '15:00' | '16:00';

export default function BookConsultingPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const { session } = useSession();
    const { toast } = useToast();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);

    // Form data
    const [consultationType, setConsultationType] = useState<ConsultationType>('video');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<TimeSlot>('10:00');
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');
    const [companyName, setCompanyName] = useState(profile?.company_name || '');
    const [employeeCount, setEmployeeCount] = useState('');
    const [message, setMessage] = useState('');

    const availableTimeSlots: TimeSlot[] = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

    const consultationTypes = [
        {
            value: 'video' as ConsultationType,
            label: 'Video-Call',
            description: 'Bequem von überall per Zoom/Teams',
            icon: Video,
            duration: '60 Minuten',
        },
        {
            value: 'phone' as ConsultationType,
            label: 'Telefon',
            description: 'Klassisches Telefongespräch',
            icon: Phone,
            duration: '45 Minuten',
        },
        {
            value: 'in-person' as ConsultationType,
            label: 'Vor Ort',
            description: 'Persönliches Treffen in Berlin',
            icon: MapPin,
            duration: '90 Minuten',
        },
    ];

    const handleSubmit = async () => {
        if (!user || !selectedDate) {
            toast({
                title: 'Fehler',
                description: 'Bitte füllen Sie alle Pflichtfelder aus.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        // Get the Clerk Token for Supabase
        let token = null;
        try {
            token = await session?.getToken({ template: 'supabase' });
        } catch (e) {
            console.error('Clerk Supabase Token Error:', e);
        }
        const supabase = createClientWithToken(token || null);

        try {
            // Create consultation booking
            const { error } = await supabase
                .from('consultation_bookings')
                .insert({
                    user_id: user.id,
                    consultation_type: consultationType,
                    scheduled_date: selectedDate.toISOString().split('T')[0],
                    scheduled_time: selectedTime,
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    company_name: companyName,
                    employee_count: employeeCount,
                    message: message,
                    status: 'pending',
                });

            if (error) throw error;

            // TODO: Send confirmation email
            // TODO: Add to calendar
            // TODO: Notify consultant

            toast({
                title: 'Termin angefragt!',
                description: 'Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
            });

            setStep(3);
        } catch (error: any) {
            console.error('Booking error:', error);
            toast({
                title: 'Fehler',
                description: error.message || 'Ein Fehler ist aufgetreten.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <CalendarIcon className="w-16 h-16 mx-auto text-primary" />
                            <h2 className="text-3xl font-bold">Beratungstermin buchen</h2>
                            <p className="text-muted-foreground">
                                Wählen Sie die Art der Beratung
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {consultationTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <Card
                                        key={type.value}
                                        className={`cursor-pointer transition-all ${consultationType === type.value
                                            ? 'border-primary ring-2 ring-primary/20'
                                            : 'hover:border-primary/50'
                                            }`}
                                        onClick={() => setConsultationType(type.value)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${consultationType === type.value
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary'
                                                    }`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="font-semibold text-lg">{type.label}</h3>
                                                        <span className="text-sm text-muted-foreground">{type.duration}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{type.description}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        <Card className="bg-accent/5 border-accent">
                            <CardHeader>
                                <CardTitle className="text-lg">Was erwartet Sie?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">Analyse Ihrer aktuellen Gehaltsstruktur</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">Roadmap zur EU-Compliance</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">Individuelle Empfehlungen für Ihr Unternehmen</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">Fragen & Antworten mit unserem Experten</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <Clock className="w-16 h-16 mx-auto text-primary" />
                            <h2 className="text-3xl font-bold">Termin wählen</h2>
                            <p className="text-muted-foreground">
                                Wann passt es Ihnen am besten?
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Calendar */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Datum auswählen</CardTitle>
                                    <CardDescription>Wählen Sie einen verfügbaren Tag</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        disabled={(date) => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            // Disable past dates and weekends
                                            return date < today || date.getDay() === 0 || date.getDay() === 6;
                                        }}
                                        locale={de}
                                        className="rounded-md border"
                                    />
                                </CardContent>
                            </Card>

                            {/* Time & Contact Info */}
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Uhrzeit wählen</CardTitle>
                                        <CardDescription>Verfügbare Zeitfenster</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Select value={selectedTime} onValueChange={(value) => setSelectedTime(value as TimeSlot)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableTimeSlots.map((time) => (
                                                    <SelectItem key={time} value={time}>
                                                        {time} Uhr
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Kontaktdaten</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName">Vollständiger Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="fullName"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="pl-10"
                                                    placeholder="Max Mustermann"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">E-Mail</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="pl-10"
                                                    placeholder="max@firma.de"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefon</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="pl-10"
                                                    placeholder="+49 123 456789"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="companyName">Firma</Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="companyName"
                                                    value={companyName}
                                                    onChange={(e) => setCompanyName(e.target.value)}
                                                    className="pl-10"
                                                    placeholder="Firma GmbH"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="employeeCount">Mitarbeiteranzahl</Label>
                                            <Select value={employeeCount} onValueChange={setEmployeeCount}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Bitte wählen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1-50">1-50 Mitarbeiter</SelectItem>
                                                    <SelectItem value="51-250">51-250 Mitarbeiter</SelectItem>
                                                    <SelectItem value="251-1000">251-1.000 Mitarbeiter</SelectItem>
                                                    <SelectItem value="1000+">Mehr als 1.000</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Nachricht (optional)</Label>
                                            <Textarea
                                                id="message"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Gibt es etwas Spezifisches, das Sie besprechen möchten?"
                                                rows={3}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {selectedDate && (
                            <Card className="bg-primary/5 border-primary">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <CalendarIcon className="w-8 h-8 text-primary" />
                                        <div>
                                            <p className="font-semibold">Gewählter Termin</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(selectedDate, 'EEEE, dd. MMMM yyyy', { locale: de })} um {selectedTime} Uhr
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {consultationTypes.find(t => t.value === consultationType)?.label} - {consultationTypes.find(t => t.value === consultationType)?.duration}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 mx-auto rounded-full bg-status-success/10 flex items-center justify-center">
                                <CheckCircle2 className="w-12 h-12 text-status-success" />
                            </div>
                            <h2 className="text-3xl font-bold">Termin angefragt!</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                Vielen Dank für Ihre Anfrage. Wir haben Ihnen eine Bestätigungs-E-Mail gesendet und melden uns innerhalb von 24 Stunden bei Ihnen.
                            </p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Ihre Termindetails</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Datum</p>
                                        <p className="font-medium">
                                            {selectedDate && format(selectedDate, 'dd.MM.yyyy', { locale: de })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Uhrzeit</p>
                                        <p className="font-medium">{selectedTime} Uhr</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Art</p>
                                        <p className="font-medium">
                                            {consultationTypes.find(t => t.value === consultationType)?.label}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Dauer</p>
                                        <p className="font-medium">
                                            {consultationTypes.find(t => t.value === consultationType)?.duration}
                                        </p>
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
                                            <p className="font-medium">Bestätigungs-E-Mail prüfen</p>
                                            <p className="text-sm text-muted-foreground">
                                                Wir haben Ihnen alle Details per E-Mail gesendet
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5" />
                                        <div>
                                            <p className="font-medium">Termin in Kalender eintragen</p>
                                            <p className="text-sm text-muted-foreground">
                                                Laden Sie die .ics-Datei aus der E-Mail herunter
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-status-success mt-0.5" />
                                        <div>
                                            <p className="font-medium">Vorbereitung</p>
                                            <p className="text-sm text-muted-foreground">
                                                Notieren Sie Fragen, die Sie besprechen möchten
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <div className="flex gap-4">
                            <Button onClick={() => router.push('/dashboard')} className="flex-1">
                                Zum Dashboard
                            </Button>
                            <Button onClick={() => window.location.href = 'https://klargehalt.de'} variant="outline" className="flex-1">
                                Zur Startseite
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        if (step === 1) return true;
        if (step === 2) {
            return selectedDate && fullName && email && phone && companyName && employeeCount;
        }
        return false;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => step > 1 ? setStep((prev) => (prev - 1) as 1 | 2 | 3) : router.back()}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Zurück
                        </Button>
                        {step < 3 && (
                            <div className="text-sm text-muted-foreground">
                                Schritt {step} von 2
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                {renderStep()}

                {/* Navigation */}
                {step < 3 && (
                    <div className="flex items-center justify-end mt-8">
                        <Button
                            onClick={() => step === 1 ? setStep(2) : handleSubmit()}
                            disabled={!canProceed() || loading}
                            size="lg"
                        >
                            {loading ? 'Wird gesendet...' : step === 1 ? 'Weiter' : 'Termin anfragen'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
