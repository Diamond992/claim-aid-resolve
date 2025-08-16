import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Eye } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id?: string;
  nom_modele: string;
  type_sinistre: string;
  type_courrier: string;
  template_content: string;
  variables_requises: string[];
  actif: boolean;
}

interface CreateEditTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template?: Template | null;
  onSave: (template: Omit<Template, 'id'>) => void;
  isLoading?: boolean;
}

const CreateEditTemplateDialog = ({ 
  isOpen, 
  onClose, 
  template, 
  onSave,
  isLoading = false 
}: CreateEditTemplateDialogProps) => {
  const [formData, setFormData] = useState<Omit<Template, 'id'>>({
    nom_modele: "",
    type_sinistre: "",
    type_courrier: "",
    template_content: "",
    variables_requises: [],
    actif: true
  });
  
  const [newVariable, setNewVariable] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        nom_modele: template.nom_modele,
        type_sinistre: template.type_sinistre,
        type_courrier: template.type_courrier,
        template_content: template.template_content,
        variables_requises: Array.isArray(template.variables_requises) 
          ? template.variables_requises 
          : [],
        actif: template.actif
      });
    } else {
      setFormData({
        nom_modele: "",
        type_sinistre: "",
        type_courrier: "",
        template_content: "",
        variables_requises: [],
        actif: true
      });
    }
  }, [template, isOpen]);

  const handleInputChange = (field: keyof Omit<Template, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addVariable = () => {
    if (newVariable.trim() && !formData.variables_requises.includes(newVariable.trim())) {
      setFormData(prev => ({
        ...prev,
        variables_requises: [...prev.variables_requises, newVariable.trim()]
      }));
      setNewVariable("");
    }
  };

  const removeVariable = (variableToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      variables_requises: prev.variables_requises.filter(v => v !== variableToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom_modele.trim()) {
      toast.error("Le nom du modèle est requis");
      return;
    }
    
    if (!formData.type_sinistre) {
      toast.error("Le type de sinistre est requis");
      return;
    }
    
    if (!formData.type_courrier) {
      toast.error("Le type de courrier est requis");
      return;
    }
    
    if (!formData.template_content.trim()) {
      toast.error("Le contenu du template est requis");
      return;
    }

    onSave(formData);
  };

  const getPreviewContent = () => {
    let content = formData.template_content;
    formData.variables_requises.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, `[${variable.toUpperCase()}]`);
    });
    return content;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template ? "Modifier le modèle" : "Nouveau modèle de courrier"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom_modele">Nom du modèle *</Label>
              <Input
                id="nom_modele"
                value={formData.nom_modele}
                onChange={(e) => handleInputChange('nom_modele', e.target.value)}
                placeholder="ex: Réclamation Auto Standard"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type_sinistre">Type de sinistre *</Label>
              <Select 
                value={formData.type_sinistre} 
                onValueChange={(value) => handleInputChange('type_sinistre', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="habitation">Habitation</SelectItem>
                  <SelectItem value="sante">Santé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type_courrier">Type de courrier *</Label>
              <Select 
                value={formData.type_courrier} 
                onValueChange={(value) => handleInputChange('type_courrier', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reclamation_interne">Réclamation interne</SelectItem>
                  <SelectItem value="mediation">Médiation</SelectItem>
                  <SelectItem value="mise_en_demeure">Mise en demeure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variables du template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nom de la variable (ex: nom_client)"
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                />
                <Button type="button" onClick={addVariable} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.variables_requises.map((variable, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {`{{${variable}}}`}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                      onClick={() => removeVariable(variable)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Content */}
          <div className="flex-1 flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="template_content">Contenu du template *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {previewMode ? "Éditer" : "Prévisualiser"}
              </Button>
            </div>
            
            {previewMode ? (
              <Card className="flex-1">
                <CardContent className="p-4 h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{getPreviewContent()}</pre>
                </CardContent>
              </Card>
            ) : (
              <Textarea
                id="template_content"
                className="flex-1 min-h-[300px] resize-none"
                value={formData.template_content}
                onChange={(e) => handleInputChange('template_content', e.target.value)}
                placeholder="Contenu du template... Utilisez {{variable}} pour insérer des variables dynamiques."
              />
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => handleInputChange('actif', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="actif">Modèle actif</Label>
            </div>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : template ? "Modifier" : "Créer"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditTemplateDialog;