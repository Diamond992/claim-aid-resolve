
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
import { useState } from "react";

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
  onEcheanceStatusUpdate,
  onPaymentStatusUpdate,
  onCreateEcheance,
  onEditDossier,
  onDeleteDossier,
  onDeleteDocument
}: AdminTabsContentProps) => {
  const [editingDossier, setEditingDossier] = useState<any>(null);

  const handleViewDossier = (dossierId: string) => {
    // Navigate to dossier detail page
    window.open(`/dossier/${dossierId}`, '_blank');
  };

  const handleEditDossier = (dossierId: string) => {
    const dossier = allDossiers.find(d => d.id === dossierId);
    setEditingDossier(dossier);
  };

  const handleSaveDossier = (dossierData: any) => {
    onEditDossier(editingDossier.id, dossierData);
    setEditingDossier(null);
  };

  const handleViewDocument = (documentUrl: string) => {
    window.open(documentUrl, '_blank');
  };
  return (
    <Tabs defaultValue="courriers" className="w-full">
      <TabsList className="grid w-full grid-cols-10">
        <TabsTrigger value="courriers">Courriers</TabsTrigger>
        <TabsTrigger value="echeances">Échéances</TabsTrigger>
        <TabsTrigger value="payments">Paiements</TabsTrigger>
        <TabsTrigger value="dossiers">Dossiers</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        <TabsTrigger value="activity">Activité</TabsTrigger>
        <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        <TabsTrigger value="templates">Modèles</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
      </TabsList>
      
      <TabsContent value="courriers" className="mt-6">
        <CourriersList 
          courriers={courriers} 
          isLoading={isLoading}
          onValidate={onCourrierValidate}
          onReject={onCourrierReject}
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
          onViewDossier={handleViewDossier}
          onEditDossier={handleEditDossier}
          onDeleteDossier={onDeleteDossier}
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
        <TemplatesList templates={templates} />
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
    </Tabs>
  );
};

export default AdminTabsContent;
