
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateEcheanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dossiers: Array<{
    id: string;
    compagnie_assurance: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  }>;
  onCreateEcheance: (echeanceData: {
    dossier_id: string;
    type_echeance: 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale';
    date_limite: string;
    description?: string;
  }) => void;
}

const CreateEcheanceDialog = ({ isOpen, onClose, dossiers, onCreateEcheance }: CreateEcheanceDialogProps) => {
  const [formData, setFormData] = useState({
    dossier_id: '',
    type_echeance: '' as 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale' | '',
    date_limite: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.dossier_id && formData.type_echeance && formData.date_limite) {
      onCreateEcheance({
        dossier_id: formData.dossier_id,
        type_echeance: formData.type_echeance as 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale',
        date_limite: formData.date_limite,
        description: formData.description || undefined
      });
      setFormData({
        dossier_id: '',
        type_echeance: '',
        date_limite: '',
        description: ''
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle échéance</DialogTitle>
            <DialogDescription>
              Ajouter un nouveau délai à suivre pour un dossier
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dossier">Dossier</Label>
              <Select
                value={formData.dossier_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dossier_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un dossier" />
                </SelectTrigger>
                <SelectContent>
                  {dossiers.map((dossier) => (
                    <SelectItem key={dossier.id} value={dossier.id}>
                      {dossier.profiles.first_name} {dossier.profiles.last_name} - {dossier.compagnie_assurance}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type d'échéance</Label>
              <Select
                value={formData.type_echeance}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type_echeance: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reponse_reclamation">Réponse réclamation</SelectItem>
                  <SelectItem value="delai_mediation">Délai médiation</SelectItem>
                  <SelectItem value="prescription_biennale">Prescription biennale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_limite">Date limite</Label>
              <Input
                id="date_limite"
                type="date"
                value={formData.date_limite}
                onChange={(e) => setFormData(prev => ({ ...prev, date_limite: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Détails sur cette échéance..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              Créer l'échéance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEcheanceDialog;
