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
      console.log('🔍 Vérification accès dossier côté client...');
      const { data, error } = await supabase
        .from('dossiers')
        .select('client_id')
        .eq('id', dossierId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erreur vérification accès:', error);
        return false;
      }

      if (!data) {
        console.error('❌ Dossier non trouvé');
        return false;
      }

      const hasAccess = data.client_id === user?.id;
      console.log(`✅ Accès dossier: ${hasAccess ? 'autorisé' : 'refusé'}`);
      return hasAccess;
    } catch (error) {
      console.error('❌ Exception vérification accès:', error);
      return false;
    }
  };

  // Fonction d'upload avec nouvelle approche sécurisée
  const uploadFileWithRetry = async (file: File, retries = 2): Promise<boolean> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`📁 Tentative ${attempt + 1}/${retries + 1} pour ${file.name}`);
        const startTime = Date.now();

        // 1. Upload vers storage
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${file.name.replace(/\.[^/.]+$/, "")}_${timestamp}.${fileExtension}`;
        const filePath = `${user.id}/${dossierId}/${uniqueFileName}`;
        
        console.log(`📤 Upload vers storage: ${filePath}`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`❌ Erreur upload storage pour ${file.name}:`, uploadError);
          throw uploadError;
        }

        console.log(`✅ Upload storage réussi en ${Date.now() - startTime}ms`);

        // 2. URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // 3. Utiliser la fonction sécurisée pour insertion (BYPASS RLS)
        console.log(`💾 Insertion via fonction sécurisée...`);
        const dbStartTime = Date.now();
        
        const { data: documentId, error: dbError } = await supabase.rpc('upload_document_secure', {
          p_dossier_id: dossierId,
          p_nom_fichier: file.name,
          p_type_document: documentType as any,
          p_taille_fichier: file.size,
          p_mime_type: file.type,
          p_url_stockage: publicUrl
        });

        if (dbError) {
          console.error(`❌ Erreur fonction sécurisée pour ${file.name}:`, dbError);
          // Nettoyage du fichier uploadé
          console.log(`🧹 Nettoyage fichier storage...`);
          await supabase.storage.from('documents').remove([filePath]);
          throw dbError;
        }

        console.log(`✅ Document créé avec ID: ${documentId} en ${Date.now() - dbStartTime}ms`);
        console.log(`🎉 Fichier ${file.name} traité avec succès en ${Date.now() - startTime}ms total`);
        
        return true;

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Tentative ${attempt + 1} échouée pour ${file.name}:`, error);
        
        if (attempt < retries) {
          const waitTime = (attempt + 1) * 1000;
          console.log(`⏱️ Attente ${waitTime}ms avant retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    throw lastError || new Error('Upload échoué après plusieurs tentatives');
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
        try {
          await uploadFileWithRetry(file);
          uploadedCount++;

          // Pause entre fichiers pour éviter surcharge DB
          if (index < selectedFiles.length - 1) {
            console.log('⏱️ Pause 500ms entre fichiers...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (fileError) {
          console.error(`❌ Échec définitif pour ${file.name}:`, fileError);
          failedFiles.push(file.name);
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
      console.error('❌ Erreur générale upload:', error);
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