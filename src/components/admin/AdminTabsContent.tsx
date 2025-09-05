
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CourriersList from "./CourriersList";
import EcheancesList from "./EcheancesList";
import PaymentsList from "./PaymentsList";
import { WebhookLogsList } from "./WebhookLogsList";
import ActivityLogsList from "./ActivityLogsList";
import UserManagement from "./UserManagement";
import TemplatesList from "./TemplatesList";
import ConfigurationList from "./ConfigurationList";
import AdminDossiersList from "./AdminDossiersList";
import AdminDocumentsList from "./AdminDocumentsList";
import AdminEditDossier from "./AdminEditDossier";
import CreateEditTemplateDialog from "./CreateEditTemplateDialog";
import { TypesSinistresManagement } from "./TypesSinistresManagement";
import { TypesCourrierManagement } from "./TypesCourrierManagement";
import { CompatibilityMatrix } from "./CompatibilityMatrix";
import { useTemplates } from "@/hooks/useTemplates";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GenerateCourrierDialog } from "./GenerateCourrierDialog";
import { useDossierDetail } from "@/hooks/useDossierDetail";
import { useCourrierGenerator } from "@/hooks/useCourrierGenerator";
import { useAICourrierGenerator } from "@/hooks/useAICourrierGenerator";

interface AdminTabsContentProps {
  courriers: any[];
  echeances: any[];
  payments: any[];
  dossiers: any[];
  allDossiers: any[];
  templates: any[];
  isLoading: boolean;
  onCourrierValidate: (id: string) => void;
  onCourrierReject: (id: string) => void;
  onCourrierDelete?: (id: string) => void;
  onEcheanceStatusUpdate: (id: string, status: 'actif' | 'traite' | 'expire') => void;
  onPaymentStatusUpdate: (id: string, status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded') => void;
  onCreateEcheance: (echeanceData: {
    dossier_id: string;
    type_echeance: 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale';
    date_limite: string;
    description?: string;
  }) => void;
  onEditDossier: (id: string, updates: any) => void;
  onDeleteDossier: (id: string) => void;
  onDeleteDocument: (id: string) => void;
}

export const AdminTabsContent = ({ 
  courriers, 
  echeances, 
  payments, 
  dossiers,
  allDossiers, 
  templates,
  isLoading,
  onCourrierValidate,
  onCourrierReject,
  onCourrierDelete,
  onEcheanceStatusUpdate,
  onPaymentStatusUpdate,
  onCreateEcheance,
  onEditDossier,
  onDeleteDossier,
  onDeleteDocument
}: AdminTabsContentProps) => {
  const [editingDossier, setEditingDossier] = useState<any>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [isGenerateCourrierOpen, setIsGenerateCourrierOpen] = useState(false);
  const navigate = useNavigate();
  
  const { data: dossierDetail } = useDossierDetail(selectedDossierId || '');
  const { generateCourrier } = useCourrierGenerator();
  const { generateAICourrier } = useAICourrierGenerator();
  
  const { 
    createTemplate, 
    updateTemplate, 
    deleteTemplate, 
    updateTemplateStatus,
    isCreating,
    isUpdating 
  } = useTemplates();


  const handleEditDossier = (dossierId: string) => {
    const dossier = allDossiers.find(d => d.id === dossierId);
    setEditingDossier(dossier);
  };

  const handleSaveDossier = (dossierData: any) => {
    onEditDossier(editingDossier.id, dossierData);
    setEditingDossier(null);
  };

  const handleViewDocument = (documentUrl: string) => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  // Template handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = (templateData: any) => {
    if (editingTemplate) {
      updateTemplate({ id: editingTemplate.id, templateData }, {
        onSuccess: () => {
          setIsTemplateDialogOpen(false);
          setEditingTemplate(null);
        }
      });
    } else {
      createTemplate(templateData, {
        onSuccess: () => {
          setIsTemplateDialogOpen(false);
        }
      });
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) {
      deleteTemplate(id);
    }
  };

  // Generate courrier handlers
  const handleGenerateCourrier = (dossierId: string) => {
    setSelectedDossierId(dossierId);
    setIsGenerateCourrierOpen(true);
  };

  const handleGenerateCourrierSubmit = async (templateId: string, typeCourrier: string, contenuGenere: string) => {
    generateCourrier({
      dossierId: selectedDossierId!,
      templateId,
      typeCourrier: typeCourrier as 'reclamation_interne' | 'mediation' | 'mise_en_demeure',
      contenuGenere
    });
    setIsGenerateCourrierOpen(false);
    setSelectedDossierId(null);
  };
  return (
    <Tabs defaultValue="dossiers" className="w-full">
      <TabsList className="grid w-full grid-cols-12 md:grid-cols-6 lg:grid-cols-12">
        <TabsTrigger value="courriers">Courriers</TabsTrigger>
        <TabsTrigger value="echeances">Échéances</TabsTrigger>
        <TabsTrigger value="payments">Paiements</TabsTrigger>
        <TabsTrigger value="dossiers">Dossiers</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="templates">Modèles</TabsTrigger>
        <TabsTrigger value="sinistres">Types Sinistres</TabsTrigger>
        <TabsTrigger value="courriers-types">Types Courriers</TabsTrigger>
        <TabsTrigger value="compatibility">Compatibilité</TabsTrigger>
        <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        <TabsTrigger value="activity">Activité</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
      </TabsList>
      
      <TabsContent value="courriers" className="mt-6">
        <CourriersList 
          courriers={courriers} 
          isLoading={isLoading}
          onValidate={onCourrierValidate}
          onReject={onCourrierReject}
          onDelete={onCourrierDelete}
        />
      </TabsContent>
      
      <TabsContent value="echeances" className="mt-6">
        <EcheancesList 
          echeances={echeances} 
          dossiers={dossiers}
          isLoading={isLoading}
          onStatusUpdate={onEcheanceStatusUpdate}
          onCreateEcheance={onCreateEcheance}
        />
      </TabsContent>
      
      <TabsContent value="payments" className="mt-6">
        <PaymentsList 
          payments={payments}
          isLoading={isLoading}
          onStatusUpdate={onPaymentStatusUpdate}
        />
      </TabsContent>

      <TabsContent value="dossiers" className="mt-6">
        <AdminDossiersList 
          dossiers={allDossiers}
          isLoading={isLoading}
          onEditDossier={handleEditDossier}
          onDeleteDossier={onDeleteDossier}
          onGenerateCourrier={handleGenerateCourrier}
          onDeleteDocument={onDeleteDocument}
        />
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <AdminDocumentsList 
          dossiers={allDossiers}
          isLoading={isLoading}
          onDeleteDocument={onDeleteDocument}
          onViewDocument={handleViewDocument}
        />
      </TabsContent>
      
      <TabsContent value="webhooks" className="mt-6">
        <WebhookLogsList />
      </TabsContent>
      
      <TabsContent value="activity" className="mt-6">
        <ActivityLogsList />
      </TabsContent>
      
      <TabsContent value="users" className="mt-6">
        <UserManagement />
      </TabsContent>
      
      <TabsContent value="templates" className="mt-6">
        <TemplatesList 
          templates={templates}
          onCreate={handleCreateTemplate}
          onEdit={handleEditTemplate}
          onDelete={handleDeleteTemplate}
        />
      </TabsContent>

      <TabsContent value="sinistres" className="mt-6">
        <TypesSinistresManagement />
      </TabsContent>

      <TabsContent value="courriers-types" className="mt-6">
        <TypesCourrierManagement />
      </TabsContent>

      <TabsContent value="compatibility" className="mt-6">
        <CompatibilityMatrix />
      </TabsContent>
      
      <TabsContent value="config" className="mt-6">
        <ConfigurationList />
      </TabsContent>

      {/* Edit Dossier Dialog */}
      {editingDossier && (
        <AdminEditDossier
          dossier={editingDossier}
          isOpen={!!editingDossier}
          onClose={() => setEditingDossier(null)}
          onSave={handleSaveDossier}
        />
      )}

      {/* Create/Edit Template Dialog */}
      <CreateEditTemplateDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => {
          setIsTemplateDialogOpen(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
        onSave={handleSaveTemplate}
        isLoading={isCreating || isUpdating}
      />

      {/* Generate Courrier Dialog */}
      {selectedDossierId && dossierDetail && (
        <GenerateCourrierDialog
          open={isGenerateCourrierOpen}
          onClose={() => {
            setIsGenerateCourrierOpen(false);
            setSelectedDossierId(null);
          }}
          dossier={{
            id: dossierDetail.dossier.id,
            client_id: dossierDetail.dossier.client_id,
            type_sinistre: dossierDetail.dossier.type_sinistre,
            date_sinistre: dossierDetail.dossier.date_sinistre,
            montant_refuse: dossierDetail.dossier.montant_refuse,
            refus_date: dossierDetail.dossier.refus_date,
            police_number: dossierDetail.dossier.police_number,
            compagnie_assurance: dossierDetail.dossier.compagnie_assurance,
            motif_refus: dossierDetail.dossier.motif_refus || '',
            profiles: dossierDetail.dossier.profiles
          }}
          onGenerate={handleGenerateCourrierSubmit}
        />
      )}
    </Tabs>
  );
};

export default AdminTabsContent;
