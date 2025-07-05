
import { TabsContent } from "@/components/ui/tabs";
import CourriersList from "./CourriersList";
import EcheancesList from "./EcheancesList";
import PaymentsList from "./PaymentsList";
import TemplatesList from "./TemplatesList";
import UserManagement from "./UserManagement";
import AuditLog from "./AuditLog";
import ConfigurationList from "./ConfigurationList";
import { useTemplates } from "@/hooks/useTemplates";

interface AdminTabsContentProps {
  isLoading: boolean;
  courriers: any[];
  echeances: any[];
  payments: any[];
  dossiers: any[];
  onCourrierValidate: (id: string) => void;
  onCourrierReject: (id: string) => void;
  onEcheanceStatusUpdate: (id: string, statut: 'actif' | 'traite' | 'expire') => void;
  onPaymentStatusUpdate: (id: string, statut: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded') => void;
  onCreateEcheance: (echeanceData: {
    dossier_id: string;
    type_echeance: 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale';
    date_limite: string;
    description?: string;
  }) => void;
}

const AdminTabsContent = ({
  isLoading,
  courriers,
  echeances,
  payments,
  dossiers,
  onCourrierValidate,
  onCourrierReject,
  onEcheanceStatusUpdate,
  onPaymentStatusUpdate,
  onCreateEcheance,
}: AdminTabsContentProps) => {
  const { templates, deleteTemplate, updateTemplateStatus } = useTemplates();

  return (
    <>
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

      <TabsContent value="templates" className="mt-6">
        <TemplatesList
          templates={templates}
          onDelete={deleteTemplate}
          onEdit={(template) => {
            updateTemplateStatus({ id: template.id, actif: !template.actif });
          }}
        />
      </TabsContent>

      <TabsContent value="configuration" className="mt-6">
        <ConfigurationList />
      </TabsContent>

      <TabsContent value="users" className="mt-6">
        <UserManagement />
      </TabsContent>

      <TabsContent value="audit" className="mt-6">
        <AuditLog />
      </TabsContent>
    </>
  );
};

export default AdminTabsContent;
