
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Json } from "@/integrations/supabase/types";

interface Template {
  id: string;
  nom_modele: string;
  type_sinistre: string;
  type_courrier: string;
  template_content: string;
  variables_requises: Json;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplatesListProps {
  templates: Template[];
  onEdit?: (template: Template) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
}

const TemplatesList = ({ templates, onEdit, onDelete, onCreate }: TemplatesListProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'auto': return 'bg-blue-100 text-blue-800';
      case 'habitation': return 'bg-green-100 text-green-800';
      case 'sante': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCourrierTypeColor = (type: string) => {
    switch (type) {
      case 'reclamation_interne': return 'bg-orange-100 text-orange-800';
      case 'mediation': return 'bg-yellow-100 text-yellow-800';
      case 'mise_en_demeure': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCourrierType = (type: string) => {
    switch (type) {
      case 'reclamation_interne': return 'Réclamation interne';
      case 'mediation': return 'Médiation';
      case 'mise_en_demeure': return 'Mise en demeure';
      default: return type;
    }
  };

  const getVariablesArray = (variables: Json): string[] => {
    if (Array.isArray(variables)) {
      return variables as string[];
    }
    return [];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Modèles de Courriers</h2>
        {onCreate && (
          <Button onClick={onCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouveau modèle
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.nom_modele}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getTypeColor(template.type_sinistre)}>
                      {template.type_sinistre.charAt(0).toUpperCase() + template.type_sinistre.slice(1)}
                    </Badge>
                    <Badge className={getCourrierTypeColor(template.type_courrier)}>
                      {formatCourrierType(template.type_courrier)}
                    </Badge>
                    <Badge variant={template.actif ? "default" : "secondary"}>
                      {template.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>{template.nom_modele}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Badge className={getTypeColor(template.type_sinistre)}>
                            {template.type_sinistre}
                          </Badge>
                          <Badge className={getCourrierTypeColor(template.type_courrier)}>
                            {formatCourrierType(template.type_courrier)}
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Variables requises :</h4>
                          <div className="flex flex-wrap gap-1">
                            {getVariablesArray(template.variables_requises).map((variable, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {`{{${variable}}}`}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Contenu du template :</h4>
                          <ScrollArea className="h-[400px] w-full border rounded-md p-4">
                            <pre className="whitespace-pre-wrap text-sm">
                              {template.template_content}
                            </pre>
                          </ScrollArea>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>Variables : {getVariablesArray(template.variables_requises).length}</p>
                <p>Créé le : {new Date(template.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Aucun modèle de courrier trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TemplatesList;
