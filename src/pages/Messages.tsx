import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Messages as MessagesComponent } from '@/components/Messages';
import { useDossierDetail } from '@/hooks/useDossierDetail';

export const Messages = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useDossierDetail(id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data?.dossier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dossier non trouvé</h1>
          <p className="text-gray-600 mb-6">Ce dossier n'existe pas ou vous n'avez pas l'autorisation de le consulter.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/case/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dossier
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Messages - Dossier #{data.dossier.id.slice(0, 8)}
            </h1>
            <p className="text-gray-600">
              Communiquez avec nos experts concernant votre dossier
            </p>
          </div>
        </div>

        <MessagesComponent dossierId={id || ''} />
      </div>
    </div>
  );
};