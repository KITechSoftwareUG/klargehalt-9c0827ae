import { useState } from 'react';
import { useCompany, CompanyFormData } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building2, CheckCircle, ArrowRight } from 'lucide-react';

interface CompanySetupProps {
  onComplete: () => void;
}

const CompanySetup = ({ onComplete }: CompanySetupProps) => {
  const { createCompany } = useCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    legal_name: '',
    country: 'DE',
    industry: '',
    employee_size_band: undefined,
  });

  const handleSubmit = async () => {
    if (!formData.name) return;
    
    setIsSubmitting(true);
    const company = await createCompany(formData);
    setIsSubmitting(false);
    
    if (company) {
      onComplete();
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Firma einrichten</CardTitle>
          <CardDescription>
            Bevor Sie beginnen können, richten Sie bitte Ihre Firmendaten ein. 
            Diese Daten sind für die mandantenfähige Datentrennung erforderlich.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Firmenname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Muster GmbH"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="legal_name">Rechtliche Bezeichnung</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="Muster GmbH & Co. KG"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="industry">Branche</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="IT, Produktion, Handel..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employee_size_band">Unternehmensgröße (EU-Berichtspflicht)</Label>
                <Select
                  value={formData.employee_size_band}
                  onValueChange={(value: CompanyFormData['employee_size_band']) =>
                    setFormData({ ...formData, employee_size_band: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100-149">100-149 (jährlich ab 2031)</SelectItem>
                    <SelectItem value="150-249">150-249 (jährlich ab 2027)</SelectItem>
                    <SelectItem value="250+">250+ (jährlich ab 2027)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-start gap-3 mb-6 p-4 bg-status-ok/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-status-ok mt-0.5" />
              <div>
                <p className="font-medium text-foreground">DSGVO-konform</p>
                <p className="text-sm text-muted-foreground">
                  Ihre Daten werden ausschließlich auf EU-Servern gespeichert und sind durch 
                  mandantenfähige Datentrennung geschützt.
                </p>
              </div>
            </div>

            <Button 
              variant="hero" 
              className="w-full" 
              onClick={handleSubmit}
              disabled={!formData.name || isSubmitting}
            >
              {isSubmitting ? 'Wird erstellt...' : 'Firma erstellen und fortfahren'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySetup;
