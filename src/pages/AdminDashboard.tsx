import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import { AdminTabsContent } from "@/components/admin/AdminTabsContent";
import { useAdminData } from "@/hooks/useAdminData";
import { useAdminMutations } from "@/hooks/useAdminMutations";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate, useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dossiers");
  const { courriers, echeances, payments, dossiers, allDossiers, templates, isLoading } = useAdminData();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const {
    updateCourrierMutation,
    updateEcheanceStatusMutation,
    updatePaymentStatusMutation,
    createEcheanceMutation,
    deleteDossierMutation,
    updateDossierMutation,
    deleteDocumentMutation,
    deleteCourrierMutation,
  } = useAdminMutations();

  // Monitor auth state and redirect if user becomes null
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Redirect if not admin
  if (!roleLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Show loading while checking role or auth
  if (roleLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Vérification des permissions...</div>
      </div>
    );
  }

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

  const handleEditDossier = (id: string, updates: any) => {
    updateDossierMutation.mutate({ id, updates });
  };

  const handleDeleteDossier = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.')) {
      deleteDossierMutation.mutate(id);
    }
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      deleteDocumentMutation.mutate(id);
    }
  };

  const handleCourrierDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce courrier ? Cette action est irréversible.')) {
      deleteCourrierMutation.mutate(id);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
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
            allDossiers={allDossiers}
            templates={templates}
            isLoading={isLoading}
            onCourrierValidate={(id) => handleCourrierStatusUpdate(id, 'valide_pret_envoi')}
            onCourrierReject={(id) => handleCourrierStatusUpdate(id, 'rejete')}
            onCourrierDelete={(id) => handleCourrierDelete(id)}
            onEcheanceStatusUpdate={handleEcheanceStatusUpdate}
            onPaymentStatusUpdate={handlePaymentStatusUpdate}
            onCreateEcheance={handleCreateEcheance}
            onEditDossier={handleEditDossier}
            onDeleteDossier={handleDeleteDossier}
            onDeleteDocument={handleDeleteDocument}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
