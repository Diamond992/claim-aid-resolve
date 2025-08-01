import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface EditDossierProps {
  dossier: {
    id: string;
    police_number: string;
    compagnie_assurance: string;
    motif_refus?: string;
    adresse_assureur?: any;
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
    adresse_rue: dossier.adresse_assureur?.rue || '',
    adresse_ville: dossier.adresse_assureur?.ville || '',
    adresse_code_postal: dossier.adresse_assureur?.code_postal || ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
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

      const { error } = await supabase
        .from('dossiers')
        .update({
          police_number: formData.police_number,
          compagnie_assurance: formData.compagnie_assurance,
          motif_refus: formData.motif_refus || null,
          adresse_assureur: adresse_assureur
        })
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
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le dossier</DialogTitle>
          <DialogDescription>
            Vous pouvez modifier certaines informations de votre dossier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <Label htmlFor="motif_refus">Motif du refus (optionnel)</Label>
            <Textarea
              id="motif_refus"
              value={formData.motif_refus}
              onChange={(e) => handleInputChange('motif_refus', e.target.value)}
              placeholder="Décrivez le motif du refus..."
              rows={3}
            />
          </div>

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