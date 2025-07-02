import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, User, LogOut, Search, Filter, Eye, CheckCircle, XCircle, Clock, Settings, Users, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import UserManagement from "@/components/admin/UserManagement";
import AuditLog from "@/components/admin/AuditLog";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
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

      // Get user profile and check if admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner (
            role
          )
        `)
        .eq('id', session.user.id)
        .single();

      if (!profileData || !profileData.user_roles || profileData.user_roles.length === 0 || profileData.user_roles[0].role !== 'admin') {
        toast.error("Accès refusé. Compte administrateur requis.");
        navigate('/dashboard');
        return;
      }

      setProfile(profileData);
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

  const mockCases = [
    {
      id: 1,
      title: "Refus indemnisation automobile",
      clientName: "Marie Dupont",
      clientEmail: "marie.dupont@email.com",
      contractType: "Assurance Auto",
      status: "en_attente_validation",
      statusLabel: "En attente de validation",
      priority: "high",
      createdAt: "2024-01-15",
      amount: "3500€",
      description: "Refus de prise en charge suite à un accident de la route",
      aiGeneratedLetter: true,
      documentsCount: 5
    },
    {
      id: 2,
      title: "Refus remboursement habitation",
      clientName: "Pierre Martin",
      clientEmail: "pierre.martin@email.com",
      contractType: "Assurance Habitation",
      status: "en_cours_analyse",
      statusLabel: "Analyse en cours",
      priority: "medium",
      createdAt: "2024-01-10",
      amount: "8000€",
      description: "Dégât des eaux non pris en charge",
      aiGeneratedLetter: false,
      documentsCount: 3
    },
    {
      id: 3,
      title: "Refus prise en charge santé",
      clientName: "Sophie Leroy",
      clientEmail: "sophie.leroy@email.com",
      contractType: "Assurance Santé",
      status: "courrier_envoye",
      statusLabel: "Courrier envoyé",
      priority: "low",
      createdAt: "2024-01-08",
      amount: "1200€",
      description: "Refus de remboursement frais médicaux",
      aiGeneratedLetter: true,
      documentsCount: 7
    }
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      toast.success("Déconnexion réussie");
      navigate('/');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_attente_validation": return "bg-orange-500";
      case "en_cours_analyse": return "bg-blue-500";
      case "courrier_envoye": return "bg-green-500";
      case "cloture": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50";
      case "medium": return "text-orange-600 bg-orange-50";
      case "low": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const handleValidateLetter = (caseId: number) => {
    toast.success(`Courrier validé pour le dossier #${caseId}`);
  };

  const handleRequestModification = (caseId: number) => {
    toast.info(`Demande de modification envoyée pour le dossier #${caseId}`);
  };

  const filteredCases = mockCases.filter(case_ => {
    const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || case_.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockCases.length,
    pending: mockCases.filter(c => c.status === "en_attente_validation").length,
    inProgress: mockCases.filter(c => c.status === "en_cours_analyse").length,
    completed: mockCases.filter(c => c.status === "courrier_envoye").length
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
              <Badge className="bg-red-600 text-white">Admin</Badge>
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
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">
              <FileText className="h-4 w-4 mr-2" />
              Tableau de Bord
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
          </TabsList>

          <TabsContent value="dashboard">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-gray-600">Total Dossiers</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                  <div className="text-gray-600">En Attente</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
                  <div className="text-gray-600">En Cours</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                  <div className="text-gray-600">Complétés</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher par nom de client ou titre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="en_attente_validation">En attente validation</SelectItem>
                        <SelectItem value="en_cours_analyse">En cours d'analyse</SelectItem>
                        <SelectItem value="courrier_envoye">Courrier envoyé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cases List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Dossiers Clients ({filteredCases.length})</h3>
              
              {filteredCases.map((case_) => (
                <Card key={case_.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-lg">#{case_.id} - {case_.title}</CardTitle>
                          <Badge className={`${getStatusColor(case_.status)} text-white`}>
                            {case_.statusLabel}
                          </Badge>
                          <Badge className={getPriorityColor(case_.priority)}>
                            {case_.priority === 'high' ? 'Urgent' : case_.priority === 'medium' ? 'Moyen' : 'Faible'}
                          </Badge>
                        </div>
                        <CardDescription>
                          <strong>Client:</strong> {case_.clientName} ({case_.clientEmail}) • 
                          <strong> Type:</strong> {case_.contractType} • 
                          <strong> Créé:</strong> {new Date(case_.createdAt).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{case_.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Montant réclamé:</span>
                        <div className="font-semibold text-emerald-600">{case_.amount}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Documents:</span>
                        <div className="font-semibold">{case_.documentsCount} fichiers</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Courrier IA:</span>
                        <div className={`font-semibold ${case_.aiGeneratedLetter ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {case_.aiGeneratedLetter ? 'Généré' : 'En attente'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/case/${case_.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir Détails
                      </Button>
                      
                      {case_.aiGeneratedLetter && case_.status === "en_attente_validation" && (
                        <>
                          <Button 
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleValidateLetter(case_.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Valider Courrier
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRequestModification(case_.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Demander Modification
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/case/${case_.id}/messages`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCases.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun dossier trouvé</h3>
                    <p className="text-gray-600">
                      Aucun dossier ne correspond à vos critères de recherche.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
