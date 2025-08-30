import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Edit, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTypesManagement } from '@/hooks/useTypesManagement';
import { mapContractTypeToSinistre } from '@/utils/contractMapper';
import { cn } from '@/lib/utils';

interface EditDossierProps {
  dossier: {
    id: string;
    police_number: string;
    compagnie_assurance: string;
    motif_refus?: string;
    adresse_assureur?: any;
    type_sinistre?: string;
    date_sinistre?: string;
    refus_date?: string;
    montant_refuse?: number;
    description?: string;
    previousExchanges?: string;
    hasExpertise?: string;
  };
  onUpdateSuccess?: () => void;
}

export const EditDossier = ({ dossier, onUpdateSuccess }: EditDossierProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    police_number: dossier.police_number || '',
    compagnie_assurance: dossier.compagnie_assurance || '',
    motif_refus: dossier.motif_refus || '',
    type_sinistre: dossier.type_sinistre || '',
    date_sinistre: dossier.date_sinistre ? new Date(dossier.date_sinistre) : null as Date | null,
    refus_date: dossier.refus_date ? new Date(dossier.refus_date) : null as Date | null,
    montant_refuse: dossier.montant_refuse?.toString() || '',
    description: dossier.description || '',
    previousExchanges: dossier.previousExchanges || '',
    hasExpertise: dossier.hasExpertise || '',
    adresse_rue: dossier.adresse_assureur?.rue || '',
    adresse_ville: dossier.adresse_assureur?.ville || '',
    adresse_code_postal: dossier.adresse_assureur?.code_postal || ''
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const { typesSinistres } = useTypesManagement();

  const contractTypes = [
    { value: "auto", label: "Assurance Automobile" },
    { value: "habitation", label: "Assurance Habitation" },
    { value: "sante", label: "Assurance Santé" },
    { value: "prevoyance", label: "Assurance Prévoyance" },
    { value: "vie", label: "Assurance Vie" },
    { value: "responsabilite", label: "Responsabilité Civile" },
    { value: "autre", label: "Autre" }
  ];

  const refusalReasons = [
    "Exclusion contractuelle",
    "Défaut de déclaration",
    "Carence de garantie",
    "Prescription",
    "Faute intentionnelle",
    "Défaut de paiement des cotisations",
    "Vice caché",
    "Usure normale",
    "Autre"
  ];

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      const adresse_assureur = {
        rue: formData.adresse_rue,
        ville: formData.adresse_ville,
        code_postal: formData.adresse_code_postal
      };

      const updateData: any = {
        police_number: formData.police_number,
        compagnie_assurance: formData.compagnie_assurance,
        motif_refus: formData.motif_refus || null,
        adresse_assureur: adresse_assureur,
        type_sinistre: mapContractTypeToSinistre(formData.type_sinistre),
        date_sinistre: formData.date_sinistre ? format(formData.date_sinistre, 'yyyy-MM-dd') : null,
        refus_date: formData.refus_date ? format(formData.refus_date, 'yyyy-MM-dd') : null,
        montant_refuse: formData.montant_refuse ? parseFloat(formData.montant_refuse) : null,
        description: formData.description || null,
        // Note: previousExchanges and hasExpertise might need to be stored in metadata or separate fields
        // For now, we'll include them in a metadata JSON field if it exists, or skip them
      };

      const { error } = await supabase
        .from('dossiers')
        .update(updateData)
        .eq('id', dossier.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Dossier mis à jour avec succès"
      });

      setIsOpen(false);
      onUpdateSuccess?.();
    } catch (error) {
      console.error('Error updating dossier:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du dossier",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Edit className="h-4 w-4" />
          Modifier le dossier
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le dossier</DialogTitle>
          <DialogDescription>
            Vous pouvez modifier certaines informations de votre dossier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations sur le contrat */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations sur le contrat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="type_sinistre">Type de contrat d'assurance</Label>
                <Select value={formData.type_sinistre} onValueChange={(value) => handleInputChange('type_sinistre', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de contrat" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="police_number">Numéro de police</Label>
                  <Input
                    id="police_number"
                    value={formData.police_number}
                    onChange={(e) => handleInputChange('police_number', e.target.value)}
                    placeholder="Numéro de police d'assurance"
                  />
                </div>

                <div>
                  <Label htmlFor="compagnie_assurance">Compagnie d'assurance</Label>
                  <Input
                    id="compagnie_assurance"
                    value={formData.compagnie_assurance}
                    onChange={(e) => handleInputChange('compagnie_assurance', e.target.value)}
                    placeholder="Nom de la compagnie"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date du sinistre</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date_sinistre && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date_sinistre ? 
                          format(formData.date_sinistre, "PPP", { locale: fr }) : 
                          "Sélectionner une date"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date_sinistre}
                        onSelect={(date) => handleInputChange('date_sinistre', date)}
                        locale={fr}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Date du refus</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.refus_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.refus_date ? 
                          format(formData.refus_date, "PPP", { locale: fr }) : 
                          "Sélectionner une date"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.refus_date}
                        onSelect={(date) => handleInputChange('refus_date', date)}
                        locale={fr}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="montant_refuse">Montant refusé (€)</Label>
                  <Input
                    id="montant_refuse"
                    type="number"
                    step="0.01"
                    value={formData.montant_refuse}
                    onChange={(e) => handleInputChange('montant_refuse', e.target.value)}
                    placeholder="Montant en euros"
                  />
                </div>

                <div>
                  <Label htmlFor="motif_refus_select">Motif du refus</Label>
                  <Select value={formData.motif_refus} onValueChange={(value) => handleInputChange('motif_refus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le motif du refus" />
                    </SelectTrigger>
                    <SelectContent>
                      {refusalReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détails du dossier */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détails du dossier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Description détaillée de la situation</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Décrivez les circonstances du sinistre, les échanges avec votre assureur, et tout élément important pour votre dossier..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="previousExchanges">Échanges précédents avec l'assureur</Label>
                <Textarea
                  id="previousExchanges"
                  value={formData.previousExchanges}
                  onChange={(e) => handleInputChange('previousExchanges', e.target.value)}
                  placeholder="Décrivez vos échanges précédents (courriers, appels, emails) avec votre compagnie d'assurance..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="hasExpertise">Y a-t-il eu une expertise ?</Label>
                <Select value={formData.hasExpertise} onValueChange={(value) => handleInputChange('hasExpertise', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oui">Oui, il y a eu une expertise</SelectItem>
                    <SelectItem value="non">Non, pas d'expertise</SelectItem>
                    <SelectItem value="en_cours">Expertise en cours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Adresse de l'assureur */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adresse de l'assureur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adresse_rue">Rue</Label>
                <Input
                  id="adresse_rue"
                  value={formData.adresse_rue}
                  onChange={(e) => handleInputChange('adresse_rue', e.target.value)}
                  placeholder="Numéro et nom de rue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adresse_code_postal">Code postal</Label>
                  <Input
                    id="adresse_code_postal"
                    value={formData.adresse_code_postal}
                    onChange={(e) => handleInputChange('adresse_code_postal', e.target.value)}
                    placeholder="Code postal"
                  />
                </div>

                <div>
                  <Label htmlFor="adresse_ville">Ville</Label>
                  <Input
                    id="adresse_ville"
                    value={formData.adresse_ville}
                    onChange={(e) => handleInputChange('adresse_ville', e.target.value)}
                    placeholder="Ville"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};