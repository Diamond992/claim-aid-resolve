import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Document {
  id: string;
  nom_fichier: string;
  type_document: string;
  taille_fichier: number;
  mime_type: string;
  created_at: string;
  dossier_id: string;
  dossier: {
    id: string;
    type_sinistre: string;
  };
}

const getDocumentTypeLabel = (type: string) => {
  const types: { [key: string]: string } = {
    contrat_assurance: 'Contrat d\'assurance',
    facture: 'Facture',
    devis: 'Devis',
    photo_degats: 'Photo des dégâts',
    rapport_expert: 'Rapport d\'expert',
    courrier_assureur: 'Courrier assureur',
    autre: 'Autre'
  };
  return types[type] || type;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const UserDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          dossier:dossiers!inner (
            id,
            type_sinistre
          )
        `)
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos documents",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const handleViewDossier = (dossierId: string) => {
    navigate(`/case/${dossierId}`);
  };

  const handleDownload = (document: Document) => {
    // Simuler le téléchargement (en réalité, il faudrait récupérer le fichier depuis Supabase Storage)
    toast({
      title: "Téléchargement",
      description: `Téléchargement de ${document.nom_fichier}...`
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mes documents
            </h1>
            <p className="text-gray-600">
              Tous vos documents uploadés classés par dossier
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun document</h3>
              <p className="text-muted-foreground text-center mb-4">
                Vous n'avez encore uploadé aucun document.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Retour au tableau de bord
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold truncate">{document.nom_fichier}</h3>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <Badge variant="outline">
                          {getDocumentTypeLabel(document.type_document)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(document.taille_fichier)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(document.created_at), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Dossier: {document.dossier.type_sinistre} (#{document.dossier_id.slice(0, 8)})
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDossier(document.dossier_id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir le dossier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};