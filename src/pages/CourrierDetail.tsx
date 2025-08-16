import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Save, Eye, FileText, User, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourrierData {
  id: string;
  dossier_id: string;
  type_courrier: string;
  contenu_genere: string;
  contenu_final?: string;
  statut: string;
  admin_validateur?: string;
  date_creation: string;
  date_validation?: string;
  date_envoi?: string;
  numero_suivi?: string;
  reference_laposte?: string;
  cout_envoi?: number;
  dossier: {
    client_id: string;
    compagnie_assurance: string;
    type_sinistre: string;
    montant_refuse: number;
    police_number: string;
    date_sinistre: string;
    profiles: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

const CourrierDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [courrier, setCourrier] = useState<CourrierData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourrierDetail();
    }
  }, [id]);

  const fetchCourrierDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('courriers_projets')
        .select(`
          *,
          dossier:dossiers!inner (
            client_id,
            compagnie_assurance,
            type_sinistre,
            montant_refuse,
            police_number,
            date_sinistre,
            profiles:profiles!inner (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setCourrier(data);
      setEditedContent(data.contenu_final || data.contenu_genere);
    } catch (error) {
      console.error('Error fetching courrier:', error);
      toast.error("Erreur lors du chargement du courrier");
      navigate('/admin-dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!courrier) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('courriers_projets')
        .update({
          contenu_final: editedContent,
          statut: (courrier.statut === 'en_attente_validation' ? 'modifie_pret_envoi' : courrier.statut) as 'en_attente_validation' | 'valide_pret_envoi' | 'modifie_pret_envoi' | 'envoye' | 'rejete',
          admin_validateur: (await supabase.auth.getUser()).data.user?.id,
          date_validation: courrier.statut === 'en_attente_validation' ? new Date().toISOString() : courrier.date_validation
        })
        .eq('id', courrier.id);

      if (error) throw error;
      
      toast.success("Courrier modifié avec succès");
      setIsEditing(false);
      fetchCourrierDetail(); // Refresh data
    } catch (error) {
      console.error('Error saving courrier:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_attente_validation": return "bg-orange-500 text-white";
      case "valide_pret_envoi": return "bg-blue-500 text-white";
      case "modifie_pret_envoi": return "bg-purple-500 text-white";
      case "envoye": return "bg-green-500 text-white";
      case "rejete": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!courrier) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Courrier non trouvé</p>
          <Button onClick={() => navigate('/admin')} className="mt-4">
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getTypeCourrierLabel(courrier.type_courrier)}
              </h1>
              <p className="text-gray-600">
                Dossier: {courrier.dossier.profiles.first_name} {courrier.dossier.profiles.last_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className={getStatusColor(courrier.statut)}>
              {getStatusLabel(courrier.statut)}
            </Badge>
          </div>
        </div>

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Informations du dossier</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-500">Client</span>
                <p className="font-semibold">
                  {courrier.dossier.profiles.first_name} {courrier.dossier.profiles.last_name}
                </p>
                <p className="text-sm text-gray-600">{courrier.dossier.profiles.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Compagnie</span>
                <p className="font-semibold">{courrier.dossier.compagnie_assurance}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Type de sinistre</span>
                <p className="font-semibold capitalize">{courrier.dossier.type_sinistre}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Montant réclamé</span>
                <p className="font-semibold text-green-600">{courrier.dossier.montant_refuse}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates and Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Suivi et dates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500">Date de création</span>
                <p className="font-semibold">
                  {new Date(courrier.date_creation).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {courrier.date_validation && (
                <div>
                  <span className="text-sm text-gray-500">Date de validation</span>
                  <p className="font-semibold">
                    {new Date(courrier.date_validation).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              {courrier.date_envoi && (
                <div>
                  <span className="text-sm text-gray-500">Date d'envoi</span>
                  <p className="font-semibold">
                    {new Date(courrier.date_envoi).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
            
            {(courrier.numero_suivi || courrier.reference_laposte || courrier.cout_envoi) && (
              <>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {courrier.numero_suivi && (
                    <div>
                      <span className="text-sm text-gray-500">Numéro de suivi</span>
                      <p className="font-semibold">{courrier.numero_suivi}</p>
                    </div>
                  )}
                  {courrier.reference_laposte && (
                    <div>
                      <span className="text-sm text-gray-500">Référence La Poste</span>
                      <p className="font-semibold">{courrier.reference_laposte}</p>
                    </div>
                  )}
                  {courrier.cout_envoi && (
                    <div>
                      <span className="text-sm text-gray-500">Coût d'envoi</span>
                      <p className="font-semibold text-orange-600">{courrier.cout_envoi}€</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Contenu du courrier</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent(courrier.contenu_final || courrier.contenu_genere);
                      }}
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    disabled={courrier.statut === 'envoye'}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generated Content (read-only) */}
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">Contenu généré par IA:</h4>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm">{courrier.contenu_genere}</pre>
              </div>
            </div>

            <Separator />

            {/* Final Content (editable) */}
            <div>
              <h4 className="font-semibold mb-2 text-blue-700">
                {courrier.contenu_final ? 'Contenu final (modifié):' : 'Contenu final:'}
              </h4>
              {isEditing ? (
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Modifiez le contenu du courrier..."
                />
              ) : (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <pre className="whitespace-pre-wrap text-sm">
                    {courrier.contenu_final || courrier.contenu_genere}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourrierDetail;