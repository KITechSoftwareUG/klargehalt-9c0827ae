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
    tax_id: '',
    address: '',
    country: 'DE',
    industry: '',
    employee_count_range: undefined,
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="legal_name">Rechtliche Bezeichnung</Label>
                <Input
                  id="legal_name"
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  placeholder="Muster GmbH & Co. KG"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax_id">Steuernummer / USt-IdNr.</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder="DE123456789"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Musterstraße 1, 12345 Berlin"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="employee_count">Mitarbeiteranzahl</Label>
                <Select
                  value={formData.employee_count_range}
                  onValueChange={(value: CompanyFormData['employee_count_range']) => 
                    setFormData({ ...formData, employee_count_range: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-50">1-50</SelectItem>
                    <SelectItem value="51-100">51-100</SelectItem>
                    <SelectItem value="101-250">101-250</SelectItem>
                    <SelectItem value="251-500">251-500</SelectItem>
                    <SelectItem value="501-1000">501-1000</SelectItem>
                    <SelectItem value="1000+">1000+</SelectItem>
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
