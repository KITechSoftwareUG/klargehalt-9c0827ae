import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const loginSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  password: z.string().min(6, 'Das Passwort muss mindestens 6 Zeichen lang sein'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Bitte geben Sie Ihren vollständigen Namen ein'),
  companyName: z.string().min(2, 'Bitte geben Sie Ihren Firmennamen ein'),
  role: z.enum(['admin', 'hr_manager', 'employee']),
});

type AppRole = 'admin' | 'hr_manager' | 'employee';

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<AppRole>('employee');

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          toast({
            title: 'Validierungsfehler',
            description: validation.error.errors[0].message,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          let message = 'Ein Fehler ist aufgetreten';
          if (error.message.includes('Invalid login credentials')) {
            message = 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.';
          }
          toast({
            title: 'Anmeldung fehlgeschlagen',
            description: message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erfolgreich angemeldet',
            description: 'Willkommen zurück bei EntgeltGuard!',
          });
          navigate('/dashboard');
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, fullName, companyName, role });
        if (!validation.success) {
          toast({
            title: 'Validierungsfehler',
            description: validation.error.errors[0].message,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, fullName, companyName, role);
        if (error) {
          let message = 'Ein Fehler ist aufgetreten';
          if (error.message.includes('User already registered')) {
            message = 'Diese E-Mail-Adresse ist bereits registriert.';
          }
          toast({
            title: 'Registrierung fehlgeschlagen',
            description: message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Erfolgreich registriert',
            description: 'Willkommen bei EntgeltGuard!',
          });
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  const roleLabels: Record<AppRole, string> = {
    admin: 'Administrator',
    hr_manager: 'HR-Manager',
    employee: 'Mitarbeiter',
  };

  return (
    <>
      <Helmet>
        <title>{isLogin ? 'Anmelden' : 'Registrieren'} - EntgeltGuard</title>
        <meta name="description" content="Melden Sie sich bei EntgeltGuard an oder erstellen Sie ein neues Konto." />
      </Helmet>

      <div className="min-h-screen bg-background flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="h-12 w-12" />
              <span className="text-3xl font-bold">EntgeltGuard</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              EU-Entgelttransparenz rechtssicher umsetzen
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Schützen Sie Ihr Unternehmen vor Klagen, Bußgeldern und Chaos.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-status-ok"></div>
                <span>DSGVO-konform & rechtssicher</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-status-ok"></div>
                <span>EU-Server & verschlüsselt</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-status-ok"></div>
                <span>Revisionssichere Audit-Logs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="p-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Startseite
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center lg:hidden">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold text-primary">EntgeltGuard</span>
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">
                  {isLogin ? 'Willkommen zurück' : 'Konto erstellen'}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {isLogin 
                    ? 'Melden Sie sich an, um auf Ihr Dashboard zuzugreifen' 
                    : 'Registrieren Sie sich für EntgeltGuard'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Vollständiger Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Max Mustermann"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName">Firmenname</Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Musterfirma GmbH"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Rolle</Label>
                      <Select value={role} onValueChange={(value: AppRole) => setRole(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen Sie Ihre Rolle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="hr_manager">HR-Manager</SelectItem>
                          <SelectItem value="employee">Mitarbeiter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="max@musterfirma.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" variant="hero" disabled={loading}>
                  {loading ? 'Wird verarbeitet...' : (isLogin ? 'Anmelden' : 'Registrieren')}
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {isLogin 
                    ? 'Noch kein Konto? Jetzt registrieren' 
                    : 'Bereits ein Konto? Jetzt anmelden'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
