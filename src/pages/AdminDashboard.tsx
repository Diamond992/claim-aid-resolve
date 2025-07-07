
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import { AdminTabsContent } from "@/components/admin/AdminTabsContent";
import { useAdminData } from "@/hooks/useAdminData";
import { useAdminMutations } from "@/hooks/useAdminMutations";
import { useAuth } from "@/hooks/useAuth";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("courriers");
  const { courriers, echeances, payments, dossiers, isLoading } = useAdminData();
  const { user, signOut } = useAuth();
  const {
    updateCourrierMutation,
    updateEcheanceStatusMutation,
    updatePaymentStatusMutation,
    createEcheanceMutation,
  } = useAdminMutations();

  const handleCourrierStatusUpdate = (id: string, statut: string, adminId?: string) => {
    updateCourrierMutation.mutate({ id, statut, admin_validateur: adminId });
  };

  const handleEcheanceStatusUpdate = (id: string, statut: 'actif' | 'traite' | 'expire') => {
    updateEcheanceStatusMutation.mutate({ id, statut });
  };

  const handlePaymentStatusUpdate = (id: string, statut: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'refunded') => {
    updatePaymentStatusMutation.mutate({ id, statut });
  };

  const handleCreateEcheance = (echeanceData: {
    dossier_id: string;
    type_echeance: 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale';
    date_limite: string;
    description?: string;
  }) => {
    createEcheanceMutation.mutate(echeanceData);
  };

  const handleLogout = () => {
    signOut();
  };

  // Calculate stats for AdminStatsCards
  const stats = {
    total: courriers.length,
    pending: courriers.filter(c => c.statut === 'en_attente_validation').length,
    validated: courriers.filter(c => c.statut === 'valide_pret_envoi' || c.statut === 'modifie_pret_envoi').length,
    sent: courriers.filter(c => c.statut === 'envoye').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        displayName={user?.email || "Administrateur"}
        onLogout={handleLogout}
      />
      
      <div className="container mx-auto px-6 py-8">
        <AdminStatsCards stats={stats} />
        
        <div className="mt-8">
          <AdminTabsContent
            courriers={courriers}
            echeances={echeances}
            payments={payments}
            dossiers={dossiers}
            isLoading={isLoading}
            onCourrierValidate={(id) => handleCourrierStatusUpdate(id, 'valide_pret_envoi')}
            onCourrierReject={(id) => handleCourrierStatusUpdate(id, 'rejete')}
            onEcheanceStatusUpdate={handleEcheanceStatusUpdate}
            onPaymentStatusUpdate={handlePaymentStatusUpdate}
            onCreateEcheance={handleCreateEcheance}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
