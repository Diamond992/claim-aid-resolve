
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import CourriersList from "@/components/admin/CourriersList";
import EcheancesList from "@/components/admin/EcheancesList";
import PaymentsList from "@/components/admin/PaymentsList";
import CreateEcheanceDialog from "@/components/admin/CreateEcheanceDialog";
import UserManagement from "@/components/admin/UserManagement";
import AuditLog from "@/components/admin/AuditLog";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("courriers");
  const queryClient = useQueryClient();

  // Fetch courriers data
  const { data: courriers = [], isLoading: courriersLoading } = useQuery({
    queryKey: ['admin-courriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courriers_projets')
        .select(`
          *,
          dossier:dossiers (
            compagnie_assurance,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch echeances data
  const { data: echeances = [], isLoading: echeancesLoading } = useQuery({
    queryKey: ['admin-echeances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('echeances')
        .select(`
          *,
          dossier:dossiers (
            compagnie_assurance,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .order('date_limite', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch payments data
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paiements')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email
          ),
          dossier:dossiers (
            compagnie_assurance
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch dossiers for echeances creation
  const { data: dossiers = [] } = useQuery({
    queryKey: ['admin-dossiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          compagnie_assurance,
          profiles (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Update courrier status mutation
  const updateCourrierMutation = useMutation({
    mutationFn: async ({ id, statut, admin_validateur }: { 
      id: string; 
      statut: string; 
      admin_validateur?: string;
    }) => {
      const updateData: any = { 
        statut,
        updated_at: new Date().toISOString()
      };
      
      if (statut === 'valide_pret_envoi' || statut === 'modifie_pret_envoi') {
        updateData.admin_validateur = admin_validateur;
        updateData.date_validation = new Date().toISOString();
      }

      const { error } = await supabase
        .from('courriers_projets')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courriers'] });
      toast.success("Statut du courrier mis à jour");
    },
    onError: (error) => {
      console.error('Error updating courrier:', error);
      toast.error("Erreur lors de la mise à jour du courrier");
    },
  });

  // Update echeance status mutation
  const updateEcheanceStatusMutation = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase
        .from('echeances')
        .update({ 
          statut,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-echeances'] });
      toast.success("Statut de l'échéance mis à jour");
    },
    onError: (error) => {
      console.error('Error updating echeance:', error);
      toast.error("Erreur lors de la mise à jour de l'échéance");
    },
  });

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase
        .from('paiements')
        .update({ 
          statut,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast.success("Statut du paiement mis à jour");
    },
    onError: (error) => {
      console.error('Error updating payment:', error);
      toast.error("Erreur lors de la mise à jour du paiement");
    },
  });

  // Create echeance mutation
  const createEcheanceMutation = useMutation({
    mutationFn: async (echeanceData: {
      dossier_id: string;
      type_echeance: 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale';
      date_limite: string;
      description?: string;
    }) => {
      const { error } = await supabase
        .from('echeances')
        .insert([echeanceData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-echeances'] });
      toast.success("Échéance créée avec succès");
    },
    onError: (error) => {
      console.error('Error creating echeance:', error);
      toast.error("Erreur lors de la création de l'échéance");
    },
  });

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

  const isLoading = courriersLoading || echeancesLoading || paymentsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <div className="container mx-auto px-6 py-8">
        <AdminStatsCards 
          courriers={courriers}
          echeances={echeances}
          payments={payments}
        />
        
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="courriers">Courriers</TabsTrigger>
              <TabsTrigger value="echeances">Échéances</TabsTrigger>
              <TabsTrigger value="payments">Paiements</TabsTrigger>
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="courriers" className="mt-6">
              {isLoading ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p>Chargement des courriers...</p>
                  </CardContent>
                </Card>
              ) : (
                <CourriersList 
                  courriers={courriers}
                  onUpdateStatus={handleCourrierStatusUpdate}
                />
              )}
            </TabsContent>
            
            <TabsContent value="echeances" className="mt-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gestion des Échéances</h2>
                <CreateEcheanceDialog
                  dossiers={dossiers}
                  onCreateEcheance={handleCreateEcheance}
                />
              </div>
              
              {isLoading ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p>Chargement des échéances...</p>
                  </CardContent>
                </Card>
              ) : (
                <EcheancesList 
                  echeances={echeances}
                  onUpdateStatus={handleEcheanceStatusUpdate}
                />
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              {isLoading ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p>Chargement des paiements...</p>
                  </CardContent>
                </Card>
              ) : (
                <PaymentsList 
                  payments={payments}
                  onUpdateStatus={handlePaymentStatusUpdate}
                />
              )}
            </TabsContent>
            
            <TabsContent value="users" className="mt-6">
              <UserManagement />
            </TabsContent>
            
            <TabsContent value="audit" className="mt-6">
              <AuditLog />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
