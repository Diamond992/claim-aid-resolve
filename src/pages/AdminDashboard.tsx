
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Users, Activity, Settings, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import UserManagement from "@/components/admin/UserManagement";
import AuditLog from "@/components/admin/AuditLog";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminFilters from "@/components/admin/AdminFilters";
import CourriersList from "@/components/admin/CourriersList";
import LegacyStatsCards from "@/components/admin/LegacyStatsCards";
import LegacyCourriersList from "@/components/admin/LegacyCourriersList";
import EcheancesList from "@/components/admin/EcheancesList";
import CreateEcheanceDialog from "@/components/admin/CreateEcheanceDialog";

interface CourierData {
  id: string;
  dossier_id: string;
  type_courrier: string;
  contenu_genere: string;
  contenu_final?: string;
  statut: string;
  admin_validateur?: string;
  numero_suivi?: string;
  cout_envoi?: number;
  reference_laposte?: string;
  date_creation: string;
  date_validation?: string;
  date_envoi?: string;
  dossier: {
    client_id: string;
    compagnie_assurance: string;
    type_sinistre: string;
    montant_refuse: number;
    profiles: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface EcheanceData {
  id: string;
  dossier_id: string;
  type_echeance: 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale';
  date_limite: string;
  date_alerte: string;
  statut: 'actif' | 'traite' | 'expire';
  description?: string;
  notifie: boolean;
  created_at: string;
  dossier?: {
    compagnie_assurance: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

interface DossierData {
  id: string;
  compagnie_assurance: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [courriers, setCourriers] = useState<CourierData[]>([]);
  const [echeances, setEcheances] = useState<EcheanceData[]>([]);
  const [dossiers, setDossiers] = useState<DossierData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      // Get user roles separately
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      // Check if user has admin role
      const hasAdminRole = userRoles?.some(roleRecord => roleRecord.role === 'admin');

      if (!hasAdminRole) {
        toast.error("Accès refusé. Compte administrateur requis.");
        navigate('/dashboard');
        return;
      }

      setProfile({ ...profileData, user_roles: userRoles });
      
      // Load data
      await Promise.all([loadCourriers(), loadEcheances(), loadDossiers()]);
      setIsLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCourriers = async () => {
    try {
      const { data, error } = await supabase
        .from('courriers_projets')
        .select(`
          *,
          dossier:dossiers (
            client_id,
            compagnie_assurance,
            type_sinistre,
            montant_refuse,
            profiles:client_id (
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading courriers:', error);
        toast.error("Erreur lors du chargement des courriers");
        return;
      }

      setCourriers(data || []);
    } catch (error) {
      console.error('Error loading courriers:', error);
    }
  };

  const loadEcheances = async () => {
    try {
      const { data, error } = await supabase
        .from('echeances')
        .select(`
          *,
          dossier:dossiers (
            compagnie_assurance,
            profiles:client_id (
              first_name,
              last_name
            )
          )
        `)
        .order('date_limite', { ascending: true });

      if (error) {
        console.error('Error loading echeances:', error);
        toast.error("Erreur lors du chargement des échéances");
        return;
      }

      setEcheances(data || []);
    } catch (error) {
      console.error('Error loading echeances:', error);
    }
  };

  const loadDossiers = async () => {
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          compagnie_assurance,
          profiles:client_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading dossiers:', error);
        return;
      }

      setDossiers(data || []);
    } catch (error) {
      console.error('Error loading dossiers:', error);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      toast.success("Déconnexion réussie");
      navigate('/');
    }
  };

  const handleValidateLetter = async (courrierId: string) => {
    try {
      const { error } = await supabase
        .from('courriers_projets')
        .update({
          statut: 'valide_pret_envoi',
          admin_validateur: user?.id,
          date_validation: new Date().toISOString()
        })
        .eq('id', courrierId);

      if (error) {
        toast.error("Erreur lors de la validation");
        return;
      }

      toast.success("Courrier validé avec succès");
      await loadCourriers();
    } catch (error) {
      toast.error("Erreur lors de la validation");
    }
  };

  const handleRejectLetter = async (courrierId: string) => {
    try {
      const { error } = await supabase
        .from('courriers_projets')
        .update({
          statut: 'rejete',
          admin_validateur: user?.id,
          date_validation: new Date().toISOString()
        })
        .eq('id', courrierId);

      if (error) {
        toast.error("Erreur lors du rejet");
        return;
      }

      toast.success("Courrier rejeté");
      await loadCourriers();
    } catch (error) {
      toast.error("Erreur lors du rejet");
    }
  };

  const handleUpdateEcheanceStatus = async (echeanceId: string, status: 'actif' | 'traite' | 'expire') => {
    try {
      const { error } = await supabase
        .from('echeances')
        .update({ statut: status })
        .eq('id', echeanceId);

      if (error) {
        toast.error("Erreur lors de la mise à jour du statut");
        return;
      }

      toast.success("Statut de l'échéance mis à jour");
      await loadEcheances();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleCreateEcheance = async (echeanceData: {
    dossier_id: string;
    type_echeance: 'reponse_reclamation' | 'delai_mediation' | 'prescription_biennale';
    date_limite: string;
    description?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('echeances')
        .insert([echeanceData]);

      if (error) {
        toast.error("Erreur lors de la création de l'échéance");
        return;
      }

      toast.success("Échéance créée avec succès");
      await loadEcheances();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const filteredCourriers = courriers.filter(courrier => {
    const clientName = `${courrier.dossier?.profiles?.first_name || ''} ${courrier.dossier?.profiles?.last_name || ''}`.toLowerCase();
    const matchesSearch = clientName.includes(searchTerm.toLowerCase()) ||
                         courrier.dossier?.compagnie_assurance?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || courrier.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: courriers.length,
    pending: courriers.filter(c => c.statut === "en_attente_validation").length,
    validated: courriers.filter(c => c.statut === "valide_pret_envoi" || c.statut === "modifie_pret_envoi").length,
    sent: courriers.filter(c => c.statut === "envoye").length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    );
  }

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : user?.email || "Administrateur";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <AdminHeader displayName={displayName} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="courriers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="courriers">
              <Bot className="h-4 w-4 mr-2" />
              Courriers IA
            </TabsTrigger>
            <TabsTrigger value="echeances">
              <Calendar className="h-4 w-4 mr-2" />
              Échéances
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Activity className="h-4 w-4 mr-2" />
              Journal d'Audit
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </TabsTrigger>
            <TabsTrigger value="legacy">
              <FileText className="h-4 w-4 mr-2" />
              Vue Legacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courriers">
            <AdminStatsCards stats={stats} />
            <AdminFilters
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              onSearchChange={setSearchTerm}
              onStatusChange={setStatusFilter}
            />
            <CourriersList
              courriers={filteredCourriers}
              onValidate={handleValidateLetter}
              onReject={handleRejectLetter}
            />
          </TabsContent>

          <TabsContent value="echeances">
            <div className="flex justify-end mb-6">
              <CreateEcheanceDialog
                dossiers={dossiers}
                onCreateEcheance={handleCreateEcheance}
              />
            </div>
            <EcheancesList
              echeances={echeances}
              onUpdateStatus={handleUpdateEcheanceStatus}
            />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLog />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Système</CardTitle>
                <CardDescription>
                  Configuration et paramètres avancés du système
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Les paramètres système seront disponibles dans une prochaine version.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legacy">
            <LegacyStatsCards stats={stats} />
            <AdminFilters
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              onSearchChange={setSearchTerm}
              onStatusChange={setStatusFilter}
            />
            <LegacyCourriersList
              courriers={filteredCourriers}
              onValidate={handleValidateLetter}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
