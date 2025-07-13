import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, MessageSquare, Upload, User, LogOut, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useClaimFormProcessor } from "@/hooks/useClaimFormProcessor";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProcessedClaims, setHasProcessedClaims] = useState(false);
  const { isProcessing, processClaimFormData } = useClaimFormProcessor(user?.id);

  useEffect(() => {
    const getProfile = async () => {
      if (!user?.id) return;

      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getProfile();
  }, [user]);

  // Fetch user's dossiers with refetch capability
  const { data: dossiers = [], isLoading: isLoadingDossiers, refetch: refetchDossiers } = useQuery({
    queryKey: ['dossiers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('dossiers')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dossiers:', error);
        toast.error('Erreur lors du chargement des dossiers');
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Process pending claims after user is authenticated and dashboard is loaded
  useEffect(() => {
    const processPendingClaims = async () => {
      // Attendre que l'authentification soit complète
      if (authLoading || !user?.id || isLoading || hasProcessedClaims || isProcessing) {
        return;
      }
      
      // Check if there's pending claim data
      const storedData = localStorage.getItem('claimFormData');
      if (!storedData) {
        return;
      }

      // Attendre un petit délai pour s'assurer que la session est bien établie
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Processing pending claim for authenticated user:', user.id);
      setHasProcessedClaims(true);
      
      try {
        const success = await processClaimFormData();
        if (success) {
          // Refetch dossiers after successful processing
          setTimeout(() => {
            refetchDossiers();
          }, 1000);
        } else {
          // En cas d'échec, permettre un nouvel essai
          setHasProcessedClaims(false);
        }
      } catch (error) {
        console.error('Error during claim processing:', error);
        setHasProcessedClaims(false);
        toast.error('Erreur lors du traitement du dossier. Veuillez réessayer.');
      }
    };

    processPendingClaims();
  }, [authLoading, user?.id, isLoading, hasProcessedClaims, isProcessing, processClaimFormData, refetchDossiers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "nouveau": return "bg-blue-500";
      case "en_cours": return "bg-orange-500";
      case "reclamation_envoyee": return "bg-green-500";
      case "mediation": return "bg-purple-500";
      case "clos": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "nouveau": return "Nouveau";
      case "en_cours": return "En cours";
      case "reclamation_envoyee": return "Réclamation envoyée";
      case "mediation": return "Médiation";
      case "clos": return "Clos";
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "auto": return "Assurance Auto";
      case "habitation": return "Assurance Habitation";
      case "sante": return "Assurance Santé";
      case "autre": return "Autre";
      default: return type;
    }
  };

  const calculateProgress = (status: string) => {
    switch (status) {
      case "nouveau": return 20;
      case "en_cours": return 50;
      case "reclamation_envoyee": return 75;
      case "mediation": return 90;
      case "clos": return 100;
      default: return 0;
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    );
  }

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : user?.email || "Utilisateur";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Mon Tableau de Bord</h1>
              {isProcessing && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Traitement en cours...</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{displayName}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bonjour {profile?.first_name || 'Utilisateur'} ! 👋
          </h2>
          <p className="text-gray-600">
            Suivez l'avancement de vos dossiers de réclamation et gérez vos documents.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/claim-form')}>
            <CardContent className="p-6 text-center">
              <Plus className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Nouveau Dossier</h3>
              <p className="text-gray-600">Créer une nouvelle réclamation</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Upload className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Mes Documents</h3>
              <p className="text-gray-600">Gérer mes justificatifs</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Messages</h3>
              <p className="text-gray-600">Communication avec nos experts</p>
            </CardContent>
          </Card>
        </div>

        {/* Cases Overview */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Mes Dossiers</h3>
            <Button onClick={() => navigate('/claim-form')} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Dossier
            </Button>
          </div>

          {isLoadingDossiers || isProcessing ? (
            <div className="text-center py-8">
              <div>Chargement des dossiers...</div>
            </div>
          ) : dossiers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dossiers.map((dossier) => (
                <Card key={dossier.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Réclamation {getTypeLabel(dossier.type_sinistre)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {dossier.compagnie_assurance} • Police {dossier.police_number}
                        </CardDescription>
                        <CardDescription className="text-xs text-gray-500">
                          Créé le {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(dossier.statut)} text-white`}>
                        {getStatusLabel(dossier.statut)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dossier.motif_refus && (
                      <p className="text-gray-600 text-sm">{dossier.motif_refus}</p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Montant réclamé:</span>
                      <span className="font-semibold text-emerald-600">
                        {dossier.montant_refuse.toFixed(2)}€
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Progression:</span>
                        <span className="text-sm font-medium">
                          {calculateProgress(dossier.statut)}%
                        </span>
                      </div>
                      <Progress value={calculateProgress(dossier.statut)} className="h-2" />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/case/${dossier.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir Détails
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/case/${dossier.id}/messages`)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun dossier pour le moment</h3>
                <p className="text-gray-600 mb-4">
                  Commencez par créer votre premier dossier de réclamation
                </p>
                <Button onClick={() => navigate('/claim-form')} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer mon premier dossier
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
