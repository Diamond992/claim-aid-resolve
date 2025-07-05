
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import CourriersList from "./CourriersList";
import EcheancesList from "./EcheancesList";
import PaymentsList from "./PaymentsList";
import CreateEcheanceDialog from "./CreateEcheanceDialog";
import UserManagement from "./UserManagement";
import AuditLog from "./AuditLog";

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
  const LoadingCard = () => (
    <Card>
      <CardContent className="text-center py-8">
        <p>Chargement...</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <TabsContent value="courriers" className="mt-6">
        {isLoading ? (
          <LoadingCard />
        ) : (
          <CourriersList 
            courriers={courriers}
            onValidate={onCourrierValidate}
            onReject={onCourrierReject}
          />
        )}
      </TabsContent>
      
      <TabsContent value="echeances" className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gestion des Échéances</h2>
          <CreateEcheanceDialog
            dossiers={dossiers}
            onCreateEcheance={onCreateEcheance}
          />
        </div>
        
        {isLoading ? (
          <LoadingCard />
        ) : (
          <EcheancesList 
            echeances={echeances}
            onUpdateStatus={onEcheanceStatusUpdate}
          />
        )}
      </TabsContent>

      <TabsContent value="payments" className="mt-6">
        {isLoading ? (
          <LoadingCard />
        ) : (
          <PaymentsList 
            payments={payments}
            onUpdateStatus={onPaymentStatusUpdate}
          />
        )}
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
