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

    try {
      for (const file of selectedFiles) {
        // Simuler l'upload (en réalité, il faudrait utiliser Supabase Storage)
        const { data, error } = await supabase
          .from('documents')
          .insert({
            dossier_id: dossierId,
            nom_fichier: file.name,
            type_document: documentType as any,
            taille_fichier: file.size,
            mime_type: file.type,
            url_stockage: `/storage/documents/${dossierId}/${file.name}`,
            uploaded_by: user.id
          });

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: `${selectedFiles.length} document(s) uploadé(s) avec succès`
      });

      setSelectedFiles([]);
      setDocumentType('');
      onUploadSuccess?.();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload des documents",
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