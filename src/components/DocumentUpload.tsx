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

  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0 || !documentType) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un fichier et un type de document",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    let uploadedCount = 0;
    let failedFiles: string[] = [];

    try {
      // Process files sequentially to avoid overwhelming the database
      for (const [index, file] of selectedFiles.entries()) {
        try {
          console.log(`📁 Début upload fichier ${index + 1}/${selectedFiles.length}: ${file.name}`);
          const startTime = Date.now();

          // 1. Upload file to Supabase Storage with unique filename to avoid conflicts
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

          // 2. Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);

          console.log(`🔗 URL publique: ${publicUrl}`);

          // 3. Insert document metadata with shorter timeout
          console.log(`💾 Insertion en base...`);
          const dbStartTime = Date.now();
          
          const { error: dbError } = await supabase
            .from('documents')
            .insert({
              dossier_id: dossierId,
              nom_fichier: file.name,
              type_document: documentType as any,
              taille_fichier: file.size,
              mime_type: file.type,
              url_stockage: publicUrl,
              uploaded_by: user.id
            });

          if (dbError) {
            console.error(`❌ Erreur insertion DB pour ${file.name}:`, dbError);
            // If database insert fails, clean up the uploaded file
            console.log(`🧹 Nettoyage fichier storage...`);
            await supabase.storage
              .from('documents')
              .remove([filePath]);
            throw dbError;
          }

          console.log(`✅ Insertion DB réussie en ${Date.now() - dbStartTime}ms`);
          console.log(`🎉 Fichier ${file.name} traité avec succès en ${Date.now() - startTime}ms total`);
          
          uploadedCount++;

          // Small delay between files to avoid overwhelming the database
          if (index < selectedFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (fileError) {
          console.error(`❌ Erreur pour le fichier ${file.name}:`, fileError);
          failedFiles.push(file.name);
        }
      }

      // Show results
      if (uploadedCount > 0) {
        toast({
          title: "Succès",
          description: `${uploadedCount} document(s) uploadé(s) avec succès${failedFiles.length > 0 ? `, ${failedFiles.length} échec(s)` : ''}`
        });
      }

      if (failedFiles.length > 0) {
        toast({
          title: "Attention",
          description: `Échec d'upload pour: ${failedFiles.join(', ')}`,
          variant: "destructive"
        });
      }

      // Only clear files if at least one was uploaded successfully
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