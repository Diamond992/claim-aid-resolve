import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, User, LogOut, Search, Filter, Eye, CheckCircle, XCircle, Clock, Settings, Users, Activity, Bot, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import UserManagement from "@/components/admin/UserManagement";
import AuditLog from "@/components/admin/AuditLog";

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [courriers, setCourriers] = useState<CourierData[]>([]);
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
      
      // Load courriers data
      await loadCourriers();
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
      case "valide_pret_envoi": return "bg-blue-500";
      case "modifie_pret_envoi": return "bg-purple-500";
      case "envoye": return "bg-green-500";
      case "rejete": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "en_attente_validation": return "En attente de validation";
      case "valide_pret_envoi": return "Validé - Prêt à envoyer";
      case "modifie_pret_envoi": return "Modifié - Prêt à envoyer";
      case "envoye": return "Envoyé";
      case "rejete": return "Rejeté";
      default: return status;
    }
  };

  const getTypeCourrierLabel = (type: string) => {
    switch (type) {
      case "reclamation_interne": return "Réclamation interne";
      case "mediation": return "Médiation";
      case "mise_en_demeure": return "Mise en demeure";
      default: return type;
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
        <Tabs defaultValue="courriers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="courriers">
              <Bot className="h-4 w-4 mr-2" />
              Courriers IA
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <Bot className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-gray-600">Total Courriers</div>
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
                  <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.validated}</div>
                  <div className="text-gray-600">Validés</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Mail className="h-12 w-12 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.sent}</div>
                  <div className="text-gray-600">Envoyés</div>
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
                        placeholder="Rechercher par nom de client ou compagnie..."
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
                        <SelectItem value="valide_pret_envoi">Validé - Prêt</SelectItem>
                        <SelectItem value="modifie_pret_envoi">Modifié - Prêt</SelectItem>
                        <SelectItem value="envoye">Envoyé</SelectItem>
                        <SelectItem value="rejete">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Courriers List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900">Courriers IA ({filteredCourriers.length})</h3>
              
              {filteredCourriers.map((courrier) => (
                <Card key={courrier.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-lg">
                            <Bot className="inline h-5 w-5 mr-2" />
                            {getTypeCourrierLabel(courrier.type_courrier)}
                          </CardTitle>
                          <Badge className={`${getStatusColor(courrier.statut)} text-white`}>
                            {getStatusLabel(courrier.statut)}
                          </Badge>
                        </div>
                        <CardDescription>
                          <strong>Client:</strong> {courrier.dossier?.profiles?.first_name} {courrier.dossier?.profiles?.last_name} ({courrier.dossier?.profiles?.email}) • 
                          <strong> Compagnie:</strong> {courrier.dossier?.compagnie_assurance} • 
                          <strong> Type:</strong> {courrier.dossier?.type_sinistre} • 
                          <strong> Créé:</strong> {new Date(courrier.date_creation).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Contenu généré par IA:</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">{courrier.contenu_genere}</p>
                    </div>
                    
                    {courrier.contenu_final && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Contenu final:</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{courrier.contenu_final}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Montant réclamé:</span>
                        <div className="font-semibold text-emerald-600">{courrier.dossier?.montant_refuse}€</div>
                      </div>
                      {courrier.numero_suivi && (
                        <div>
                          <span className="text-gray-500">N° de suivi:</span>
                          <div className="font-semibold">{courrier.numero_suivi}</div>
                        </div>
                      )}
                      {courrier.cout_envoi && (
                        <div>
                          <span className="text-gray-500">Coût d'envoi:</span>
                          <div className="font-semibold">{courrier.cout_envoi}€</div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/courrier/${courrier.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir Détails
                      </Button>
                      
                      {courrier.statut === "en_attente_validation" && (
                        <>
                          <Button 
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleValidateLetter(courrier.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Valider
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            onClick={() => handleRejectLetter(courrier.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCourriers.length === 0 && (
                <Card className="text-center py-12">
                  <CardContent>
                    <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun courrier trouvé</h3>
                    <p className="text-gray-600">
                      Aucun courrier IA ne correspond à vos critères de recherche.
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

          {/* Legacy Dashboard Tab */}
          <TabsContent value="legacy">
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
              <h3 className="text-xl font-bold text-gray-900">Dossiers Clients ({filteredCourriers.length})</h3>
              
              {filteredCourriers.map((courrier) => (
                <Card key={courrier.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-lg">#{courrier.id} - {courrier.dossier?.compagnie_assurance}</CardTitle>
                          <Badge className={`${getStatusColor(courrier.statut)} text-white`}>
                            {getStatusLabel(courrier.statut)}
                          </Badge>
                          {/*<Badge className={getPriorityColor(case_.priority)}>
                            {case_.priority === 'high' ? 'Urgent' : case_.priority === 'medium' ? 'Moyen' : 'Faible'}
                          </Badge>*/}
                        </div>
                        <CardDescription>
                          <strong>Client:</strong> {courrier.dossier?.profiles?.first_name} {courrier.dossier?.profiles?.last_name} ({courrier.dossier?.profiles?.email}) • 
                          <strong> Type:</strong> {courrier.dossier?.type_sinistre} • 
                          <strong> Créé:</strong> {new Date(courrier.date_creation).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{courrier.contenu_genere}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Montant réclamé:</span>
                        <div className="font-semibold text-emerald-600">{courrier.dossier?.montant_refuse}€</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Documents:</span>
                        <div className="font-semibold">5 fichiers</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Courrier IA:</span>
                        <div className={`font-semibold text-emerald-600`}>
                          Généré
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/case/${courrier.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir Détails
                      </Button>
                      
                      {courrier.statut === "en_attente_validation" && (
                        <>
                          <Button 
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleValidateLetter(courrier.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Valider Courrier
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/admin/case/${courrier.id}/messages`)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Demander Modification
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/case/${courrier.id}/messages`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCourriers.length === 0 && (
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
