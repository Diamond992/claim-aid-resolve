import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  dossierId: string;
  onUploadSuccess?: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'refus_assurance', label: 'Courrier de refus d\'assurance' },
  { value: 'police', label: 'Contrat/Police d\'assurance' },
  { value: 'facture', label: 'Facture' },
  { value: 'expertise', label: 'Rapport d\'expertise' },
  { value: 'autre', label: 'Autre' }
];

export const DocumentUpload = ({ dossierId, onUploadSuccess }: DocumentUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Fonction de vérification côté client avant upload
  const verifyAccessToDossier = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('client_id')
        .eq('id', dossierId)
        .maybeSingle();

      if (error) {
        console.error('Erreur vérification accès:', error);
        return false;
      }

      if (!data) {
        console.error('Dossier non trouvé');
        return false;
      }

      const hasAccess = data.client_id === user?.id;
      return hasAccess;
    } catch (error) {
      console.error('Exception vérification accès:', error);
      return false;
    }
  };

  const uploadFileWithRetry = async (file: File): Promise<boolean> => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${user?.id}/${dossierId}/${fileName}`;

    try {
      // 1. Upload vers Supabase Storage
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erreur storage:', uploadError);
        throw new Error(`Erreur storage: ${uploadError.message}`);
      }
      
      // 2. Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(storageData.path);

      // 3. Enregistrement en base sécurisé (RLS activé)
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          dossier_id: dossierId,
          nom_fichier: file.name,
          type_document: documentType as any,
          taille_fichier: file.size,
          mime_type: file.type,
          url_stockage: publicUrl,
          uploaded_by: user?.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('Erreur base de données:', dbError);
        
        // Nettoyer le storage
        await supabase.storage.from('documents').remove([storageData.path]);
        
        throw new Error(`Erreur base de données: ${dbError.message}`);
      }

      if (!documentData) {
        console.error('Aucune donnée retournée');
        await supabase.storage.from('documents').remove([storageData.path]);
        throw new Error('Document non enregistré');
      }

      return true;

    } catch (error) {
      console.error(`Erreur upload ${file.name}:`, error);
      return false;
    }
  };

  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0 || !documentType) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un fichier et un type de document",
        variant: "destructive"
      });
      return;
    }

    // Vérification d'accès avant de commencer
    const hasAccess = await verifyAccessToDossier();
    if (!hasAccess) {
      toast({
        title: "Erreur d'autorisation",
        description: "Vous n'avez pas accès à ce dossier",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    let uploadedCount = 0;
    let failedFiles: string[] = [];

    try {
      // Traitement séquentiel un fichier à la fois pour éviter surcharge
      for (const [index, file] of selectedFiles.entries()) {
        const success = await uploadFileWithRetry(file);
        
        if (success) {
          uploadedCount++;
        } else {
          failedFiles.push(file.name);
        }

        // Pause entre fichiers pour éviter surcharge DB
        if (index < selectedFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Résultats
      if (uploadedCount > 0) {
        toast({
          title: "Succès",
          description: `${uploadedCount} document(s) uploadé(s) avec succès${failedFiles.length > 0 ? `, ${failedFiles.length} échec(s)` : ''}`
        });
      }

      if (failedFiles.length > 0) {
        toast({
          title: "Attention",
          description: `Échec d'upload pour: ${failedFiles.join(', ')}. Vérifiez votre connexion et réessayez.`,
          variant: "destructive"
        });
      }

      // Reset uniquement si au moins un fichier uploadé
      if (uploadedCount > 0) {
        setSelectedFiles([]);
        setDocumentType('');
        onUploadSuccess?.();
      }

    } catch (error) {
      console.error('Erreur générale upload:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'upload des documents",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Ajouter des documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="document-type">Type de document</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="file-input">Fichiers</Label>
          <Input
            id="file-input"
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            className="cursor-pointer"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Fichiers sélectionnés :</Label>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={isUploading || selectedFiles.length === 0 || !documentType}
          className="w-full"
        >
          {isUploading ? 'Upload en cours...' : 'Uploader les documents'}
        </Button>
      </CardContent>
    </Card>
  );
};