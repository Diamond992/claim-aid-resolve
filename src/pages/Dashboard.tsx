
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, MessageSquare, Upload, User, LogOut, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
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

      setProfile(profileData);
      setIsLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const mockCases = [
    {
      id: 1,
      title: "Refus indemnisation automobile",
      contractType: "Assurance Auto",
      status: "en_cours_analyse",
      statusLabel: "Analyse en cours",
      progress: 60,
      createdAt: "2024-01-15",
      amount: "3500€",
      description: "Refus de prise en charge suite à un accident de la route"
    },
    {
      id: 2,
      title: "Refus remboursement habitation",
      contractType: "Assurance Habitation",
      status: "en_attente_documents",
      statusLabel: "Documents requis",
      progress: 25,
      createdAt: "2024-01-10",
      amount: "8000€",
      description: "Dégât des eaux non pris en charge"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_cours_analyse": return "bg-blue-500";
      case "en_attente_documents": return "bg-orange-500";
      case "valide": return "bg-emerald-500";
      case "envoye": return "bg-green-500";
      case "cloture": return "bg-gray-500";
      default: return "bg-gray-500";
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockCases.map((case_) => (
              <Card key={case_.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{case_.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {case_.contractType} • Créé le {new Date(case_.createdAt).toLocaleDateString('fr-FR')}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(case_.status)} text-white`}>
                      {case_.statusLabel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{case_.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Montant réclamé:</span>
                    <span className="font-semibold text-emerald-600">{case_.amount}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Progression:</span>
                      <span className="text-sm font-medium">{case_.progress}%</span>
                    </div>
                    <Progress value={case_.progress} className="h-2" />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/case/${case_.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir Détails
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/case/${case_.id}/messages`)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {mockCases.length === 0 && (
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
