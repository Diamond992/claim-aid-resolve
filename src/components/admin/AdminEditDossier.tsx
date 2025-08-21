import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AdminEditDossierProps {
  dossier: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (dossierData: any) => void;
}

const AdminEditDossier = ({ dossier, isOpen, onClose, onSave }: AdminEditDossierProps) => {
  const [formData, setFormData] = useState({
    statut: dossier?.statut || '',
    compagnie_assurance: dossier?.compagnie_assurance || '',
    police_number: dossier?.police_number || '',
    type_sinistre: dossier?.type_sinistre || '',
    date_sinistre: dossier?.date_sinistre ? new Date(dossier.date_sinistre) : null,
    refus_date: dossier?.refus_date ? new Date(dossier.refus_date) : null,
    montant_refuse: dossier?.montant_refuse || '',
    motif_refus: dossier?.motif_refus || '',
    adresse_assureur: dossier?.adresse_assureur || {
      rue: '',
      code_postal: '',
      ville: '',
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      date_sinistre: formData.date_sinistre?.toISOString().split('T')[0],
      refus_date: formData.refus_date?.toISOString().split('T')[0],
    });
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAdresseField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      adresse_assureur: {
        ...prev.adresse_assureur,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Modifier le dossier - {dossier?.profiles?.first_name} {dossier?.profiles?.last_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="statut">Statut</Label>
              <Select value={formData.statut} onValueChange={(value) => updateFormData('statut', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nouveau">Nouveau</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                  <SelectItem value="rejete">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type_sinistre">Type de sinistre</Label>
              <Select value={formData.type_sinistre} onValueChange={(value) => updateFormData('type_sinistre', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de sinistre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="habitation">Assurance habitation</SelectItem>
                  <SelectItem value="auto">Assurance auto</SelectItem>
                  <SelectItem value="sante">Assurance santé</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Company and Policy */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="compagnie_assurance">Compagnie d'assurance</Label>
              <Input
                id="compagnie_assurance"
                value={formData.compagnie_assurance}
                onChange={(e) => updateFormData('compagnie_assurance', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="police_number">Numéro de police</Label>
              <Input
                id="police_number"
                value={formData.police_number}
                onChange={(e) => updateFormData('police_number', e.target.value)}
              />
            </div>
          </div>

          {/* Dates */}
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
                    {formData.date_sinistre ? (
                      format(formData.date_sinistre, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date_sinistre}
                    onSelect={(date) => updateFormData('date_sinistre', date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Date de refus</Label>
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
                    {formData.refus_date ? (
                      format(formData.refus_date, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.refus_date}
                    onSelect={(date) => updateFormData('refus_date', date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Amount and Reason */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="montant_refuse">Montant refusé (€)</Label>
              <Input
                id="montant_refuse"
                type="number"
                value={formData.montant_refuse}
                onChange={(e) => updateFormData('montant_refuse', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="motif_refus">Motif du refus</Label>
            <Textarea
              id="motif_refus"
              value={formData.motif_refus}
              onChange={(e) => updateFormData('motif_refus', e.target.value)}
              rows={3}
            />
          </div>

          {/* Insurance Company Address */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <Label className="text-lg font-semibold">Adresse de l'assureur</Label>
            
            <div>
              <Label htmlFor="adresse_rue">Rue</Label>
              <Input
                id="adresse_rue"
                value={formData.adresse_assureur.rue || ''}
                onChange={(e) => updateAdresseField('rue', e.target.value)}
                placeholder="Numéro et nom de rue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code_postal_assureur">Code postal</Label>
                <Input
                  id="code_postal_assureur"
                  value={formData.adresse_assureur.code_postal || ''}
                  onChange={(e) => updateAdresseField('code_postal', e.target.value)}
                  placeholder="Code postal"
                />
              </div>
              <div>
                <Label htmlFor="ville_assureur">Ville</Label>
                <Input
                  id="ville_assureur"
                  value={formData.adresse_assureur.ville || ''}
                  onChange={(e) => updateAdresseField('ville', e.target.value)}
                  placeholder="Ville"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditDossier;