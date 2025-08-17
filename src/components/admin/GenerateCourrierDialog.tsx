import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourrierGenerator, type DossierData, type TemplateVariable } from "@/services/courrierGenerator";
import { toast } from "sonner";
import { Eye, FileText, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Template {
  id: string;
  nom_modele: string;
  template_content: string;
  variables_requises: any; // Json type from Supabase
}

interface GenerateCourrierDialogProps {
  open: boolean;
  onClose: () => void;
  dossier: DossierData;
  onGenerate: (templateId: string, typeCourrier: string, contenuGenere: string) => Promise<void>;
}

export const GenerateCourrierDialog = ({
  open,
  onClose,
  dossier,
  onGenerate
}: GenerateCourrierDialogProps) => {
  const [step, setStep] = useState<'select' | 'configure' | 'preview'>('select');
  const [typeCourrier, setTypeCourrier] = useState<'reclamation_interne' | 'mediation' | 'mise_en_demeure'>('reclamation_interne');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [automaticVariables, setAutomaticVariables] = useState<TemplateVariable[]>([]);
  const [manualVariables, setManualVariables] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && step === 'select') {
      loadTemplates();
    }
  }, [open, step, typeCourrier, dossier.type_sinistre]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const availableTemplates = await CourrierGenerator.getAvailableTemplates(
        dossier.type_sinistre,
        typeCourrier
      );
      setTemplates(availableTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error("Erreur lors du chargement des modèles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    const { automaticVariables: autoVars, manualVariables: manualVars } = 
      CourrierGenerator.analyzeTemplateVariables(template.template_content, dossier);
    
    setAutomaticVariables(autoVars);
    
    // Initialize manual variables
    const initialManualVars: Record<string, string> = {};
    manualVars.forEach(variable => {
      initialManualVars[variable.key] = '';
    });
    setManualVariables(initialManualVars);
    
    setStep('configure');
  };

  const handlePreview = () => {
    if (!selectedTemplate) return;

    const content = CourrierGenerator.generateContent(
      selectedTemplate.template_content,
      dossier,
      manualVariables
    );
    setGeneratedContent(content);
    setStep('preview');
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    try {
      setIsLoading(true);
      await onGenerate(selectedTemplate.id, typeCourrier, generatedContent);
      toast.success("Courrier généré avec succès");
      handleClose();
    } catch (error) {
      console.error('Error generating courrier:', error);
      toast.error("Erreur lors de la génération du courrier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedTemplate(null);
    setAutomaticVariables([]);
    setManualVariables({});
    setGeneratedContent('');
    onClose();
  };

  const getTypeCourrierLabel = (type: string) => {
    switch (type) {
      case 'reclamation_interne': return 'Réclamation interne';
      case 'mediation': return 'Médiation';
      case 'mise_en_demeure': return 'Mise en demeure';
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générer un courrier
          </DialogTitle>
        </DialogHeader>

        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select" disabled={step !== 'select'}>
              1. Sélection
            </TabsTrigger>
            <TabsTrigger value="configure" disabled={step !== 'configure'}>
              2. Configuration
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={step !== 'preview'}>
              3. Aperçu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="type-courrier">Type de courrier</Label>
                <Select value={typeCourrier} onValueChange={(value: any) => setTypeCourrier(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reclamation_interne">Réclamation interne</SelectItem>
                    <SelectItem value="mediation">Médiation</SelectItem>
                    <SelectItem value="mise_en_demeure">Mise en demeure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Modèles disponibles</Label>
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : templates.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        Aucun modèle disponible pour ce type de courrier et de sinistre.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {templates.map((template) => (
                      <Card 
                        key={template.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">{template.nom_modele}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <Badge variant="outline">
                                {getTypeCourrierLabel(typeCourrier)}
                              </Badge>
                              <Badge variant="secondary">
                                {Array.isArray(template.variables_requises) ? template.variables_requises.length : 0} variables
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm">
                              Sélectionner
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="configure" className="space-y-6">
            {selectedTemplate && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configuration du modèle: {selectedTemplate.nom_modele}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Variables automatiques */}
                      <div>
                        <Label className="text-base font-semibold">Variables automatiques</Label>
                        <div className="space-y-3 mt-2">
                          {automaticVariables.map((variable) => (
                             <div key={variable.key} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                               <span className="font-medium">{`{{${variable.key}}}`}</span>
                               <span className="text-sm text-muted-foreground">{variable.value}</span>
                             </div>
                          ))}
                        </div>
                      </div>

                      {/* Variables manuelles */}
                      <div>
                        <Label className="text-base font-semibold">Variables à compléter</Label>
                        <div className="space-y-3 mt-2">
                          {Object.keys(manualVariables).length === 0 ? (
                            <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-lg">
                              Toutes les variables sont automatiquement remplies
                            </p>
                          ) : (
                            Object.keys(manualVariables).map((key) => (
                              <div key={key} className="space-y-2">
                                <Label htmlFor={key}>{`{{${key}}}`}</Label>
                                <Textarea
                                  id={key}
                                  value={manualVariables[key]}
                                  onChange={(e) => setManualVariables(prev => ({
                                    ...prev,
                                    [key]: e.target.value
                                  }))}
                                  placeholder={`Saisissez la valeur pour {{${key}}}`}
                                  rows={3}
                                />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button variant="outline" onClick={() => setStep('select')}>
                        Retour
                      </Button>
                      <Button onClick={handlePreview}>
                        <Eye className="h-4 w-4 mr-2" />
                        Aperçu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Aperçu du courrier généré</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg bg-muted/50">
                  <ScrollArea className="min-h-[400px] max-h-[60vh] w-full p-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground">
                      {generatedContent}
                    </pre>
                  </ScrollArea>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setStep('configure')}>
                    Modifier
                  </Button>
                  <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? "Génération..." : "Générer le courrier"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};