import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Wand2, Edit3, Sparkles, Settings, Eye } from 'lucide-react';
import { CourrierGenerator, type DossierData, type TemplateVariable } from '@/services/courrierGenerator';
import { useCourrierGenerator } from '@/hooks/useCourrierGenerator';
import { useAICourrierGenerator } from '@/hooks/useAICourrierGenerator';
import { toast } from 'sonner';

interface Template {
  id: string;
  nom_modele: string;
  template_content: string;
  variables_requises: any;
  actif: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  type_sinistre_id: string;
  type_courrier_id: string;
  types_sinistres?: { code: string; libelle: string };
  types_courriers?: { code: string; libelle: string };
}

interface TypeCourrier {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
}

interface GenerateCourrierDialogProps {
  open: boolean;
  onClose: () => void;
  dossier: DossierData;
  onGenerate: (templateId: string, typeCourrier: string, contenuGenere: string) => Promise<void>;
}

export const GenerateCourrierDialog: React.FC<GenerateCourrierDialogProps> = ({
  open,
  onClose,
  dossier,
  onGenerate
}) => {
  const [mode, setMode] = useState<'template' | 'ai'>('template');
  const [step, setStep] = useState<'select' | 'configure' | 'preview'>('select');
  const [availableCourrierTypes, setAvailableCourrierTypes] = useState<TypeCourrier[]>([]);
  const [typeCourrier, setTypeCourrier] = useState<string>('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [automaticVariables, setAutomaticVariables] = useState<TemplateVariable[]>([]);
  const [manualVariables, setManualVariables] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // AI-specific state
  const [aiTone, setAiTone] = useState<'ferme' | 'diplomatique'>('ferme');
  const [aiLength, setAiLength] = useState<'court' | 'moyen' | 'long'>('moyen');
  const [preferredModel, setPreferredModel] = useState<'auto' | 'mistral' | 'groq' | 'openai'>('auto');

  const { generateCourrier, isGenerating } = useCourrierGenerator();
  const { generateAICourrier, isGenerating: isAIGenerating } = useAICourrierGenerator();

  // Load available courrier types when dialog opens
  useEffect(() => {
    if (open && dossier.type_sinistre) {
      loadAvailableCourrierTypes();
    }
  }, [open, dossier.type_sinistre]);

  // Load templates when type courrier changes
  useEffect(() => {
    if (open && mode === 'template' && step === 'select' && typeCourrier && dossier.type_sinistre) {
      loadTemplates();
    }
  }, [open, mode, step, typeCourrier, dossier.type_sinistre]);

  const loadAvailableCourrierTypes = async () => {
    try {
      setIsLoading(true);
      const types = await CourrierGenerator.getAvailableCourrierTypes(dossier.type_sinistre);
      setAvailableCourrierTypes(types);
      
      // Auto-select first available type
      if (types.length > 0 && !typeCourrier) {
        setTypeCourrier(types[0].code);
      }
    } catch (error) {
      console.error('Error loading courrier types:', error);
      toast.error("Erreur lors du chargement des types de courriers");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleTemplateSelect = async (template: Template) => {
    try {
      setIsLoading(true);
      setSelectedTemplate(template);
      
      const { automaticVariables: autoVars, manualVariables: manualVars } = 
        await CourrierGenerator.analyzeTemplateVariables(template.template_content, dossier);
      
      setAutomaticVariables(autoVars);
      
      // Initialize manual variables
      const initialManualVars: Record<string, string> = {};
      manualVars.forEach(variable => {
        initialManualVars[variable.key] = '';
      });
      setManualVariables(initialManualVars);
      
      setStep('configure');
    } catch (error) {
      console.error('Error analyzing template:', error);
      toast.error("Erreur lors de l'analyse du modèle");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;

    try {
      setIsLoading(true);
      const content = await CourrierGenerator.generateContent(
        selectedTemplate.template_content,
        dossier,
        manualVariables
      );
      setGeneratedContent(content);
      setStep('preview');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error("Erreur lors de la génération de l'aperçu");
    } finally {
      setIsLoading(false);
    }
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

  const handleAIGenerate = async () => {
    if (!typeCourrier) return;
    
    setIsLoading(true);
    
    try {
      await generateAICourrier({
        dossierId: dossier.id,
        typeCourrier: typeCourrier as 'reclamation_interne' | 'mediation' | 'mise_en_demeure',
        tone: aiTone,
        length: aiLength
      });
      
      handleClose();
    } catch (error) {
      console.error('Error generating AI courrier:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMode('template');
    setStep('select');
    setTypeCourrier('');
    setSelectedTemplate(null);
    setAutomaticVariables([]);
    setManualVariables({});
    setGeneratedContent('');
    setAiTone('ferme');
    setAiLength('moyen');
    onClose();
  };

  const getTypeCourrierLabel = (code: string) => {
    const type = availableCourrierTypes.find(t => t.code === code);
    return type?.libelle || code;
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
        
        <div className="space-y-4">
          {/* Mode Selection */}
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'template' | 'ai')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Modèles
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                IA Personnalisée
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="mt-4">
              <Tabs value={step} onValueChange={(value) => setStep(value as any)} className="flex-1">
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

                <TabsContent value="select" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="type-courrier">Type de courrier</Label>
                      {availableCourrierTypes.length === 0 ? (
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">
                              Aucun type de courrier disponible pour ce type de sinistre.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <Select value={typeCourrier} onValueChange={setTypeCourrier}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un type de courrier" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCourrierTypes.map((type) => (
                              <SelectItem key={type.id} value={type.code}>
                                {type.libelle}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div>
                      <Label>Modèles disponibles</Label>
                      {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : !typeCourrier ? (
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">
                              Sélectionnez d'abord un type de courrier.
                            </p>
                          </CardContent>
                        </Card>
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

                <TabsContent value="configure" className="space-y-6 mt-4">
                  {selectedTemplate && (
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
                          <Button onClick={handlePreview} disabled={isLoading}>
                            <Eye className="h-4 w-4 mr-2" />
                            {isLoading ? "Génération..." : "Aperçu"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="space-y-6 mt-4">
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
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
              <div className="space-y-4">
                {/* Type de courrier pour IA */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Génération par IA
                    </CardTitle>
                    <CardDescription>
                      L'IA analysera automatiquement votre dossier et ses documents pour générer un courrier personnalisé
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sélection type courrier */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Type de courrier</Label>
                      <Select value={typeCourrier} onValueChange={setTypeCourrier}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type de courrier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reclamation_interne">Réclamation interne</SelectItem>
                          <SelectItem value="mediation">Médiation</SelectItem>
                          <SelectItem value="mise_en_demeure">Mise en demeure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Configuration du ton */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Ton du courrier</Label>
                      <Select value={aiTone} onValueChange={(value) => setAiTone(value as 'ferme' | 'diplomatique')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ferme">Ferme et assertif</SelectItem>
                          <SelectItem value="diplomatique">Diplomatique et courtois</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Configuration de la longueur */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Longueur du courrier</Label>
                      <Select value={aiLength} onValueChange={(value) => setAiLength(value as 'court' | 'moyen' | 'long')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="court">Court (300-500 mots)</SelectItem>
                          <SelectItem value="moyen">Moyen (500-800 mots)</SelectItem>
                          <SelectItem value="long">Long (800-1200 mots)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Informations du dossier */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Informations du dossier</Label>
                      <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                        <p><strong>Client:</strong> {dossier.profiles?.first_name} {dossier.profiles?.last_name}</p>
                        <p><strong>Type:</strong> {dossier.type_sinistre}</p>
                        <p><strong>Montant refusé:</strong> {dossier.montant_refuse} €</p>
                        <p><strong>Compagnie:</strong> {dossier.compagnie_assurance}</p>
                      </div>
                    </div>

                    <Button 
                      onClick={handleAIGenerate} 
                      disabled={!typeCourrier || isAIGenerating || isLoading}
                      className="w-full"
                    >
                      {(isAIGenerating || isLoading) ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Générer avec l'IA
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};