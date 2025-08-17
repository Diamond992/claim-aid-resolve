import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTypesManagement, TypeSinistre } from "@/hooks/useTypesManagement";
import { Plus, Edit, Trash2, MoveUp, MoveDown } from "lucide-react";
import { toast } from "sonner";

export const TypesSinistresManagement = () => {
  const { 
    typesSinistres, 
    loadingSinistres,
    createTypeSinistre, 
    updateTypeSinistre, 
    deleteTypeSinistre,
    isCreatingTypeSinistre,
    isUpdatingTypeSinistre,
    isDeletingTypeSinistre
  } = useTypesManagement();

  const [editingType, setEditingType] = useState<TypeSinistre | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    description: '',
    actif: true,
    ordre_affichage: 0
  });

  const resetForm = () => {
    setFormData({
      code: '',
      libelle: '',
      description: '',
      actif: true,
      ordre_affichage: 0
    });
    setEditingType(null);
  };

  const openCreateDialog = () => {
    resetForm();
    const maxOrder = Math.max(...typesSinistres.map(t => t.ordre_affichage), 0);
    setFormData(prev => ({ ...prev, ordre_affichage: maxOrder + 1 }));
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (type: TypeSinistre) => {
    setEditingType(type);
    setFormData({
      code: type.code,
      libelle: type.libelle,
      description: type.description || '',
      actif: type.actif,
      ordre_affichage: type.ordre_affichage
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.libelle.trim()) {
      toast.error("Le code et le libellé sont requis");
      return;
    }

    if (editingType) {
      updateTypeSinistre({ 
        id: editingType.id, 
        ...formData 
      });
      setIsEditDialogOpen(false);
    } else {
      createTypeSinistre(formData);
      setIsCreateDialogOpen(false);
    }
    
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteTypeSinistre(id);
  };

  const moveType = (type: TypeSinistre, direction: 'up' | 'down') => {
    const sortedTypes = [...typesSinistres].sort((a, b) => a.ordre_affichage - b.ordre_affichage);
    const currentIndex = sortedTypes.findIndex(t => t.id === type.id);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetType = sortedTypes[currentIndex - 1];
      updateTypeSinistre({ id: type.id, ordre_affichage: targetType.ordre_affichage });
      updateTypeSinistre({ id: targetType.id, ordre_affichage: type.ordre_affichage });
    } else if (direction === 'down' && currentIndex < sortedTypes.length - 1) {
      const targetType = sortedTypes[currentIndex + 1];
      updateTypeSinistre({ id: type.id, ordre_affichage: targetType.ordre_affichage });
      updateTypeSinistre({ id: targetType.id, ordre_affichage: type.ordre_affichage });
    }
  };

  if (loadingSinistres) {
    return <div className="text-center p-8">Chargement des types de sinistres...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestion des Types de Sinistres</CardTitle>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} disabled={isCreatingTypeSinistre}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau type de sinistre</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="ex: auto, habitation..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="libelle">Libellé *</Label>
                <Input
                  id="libelle"
                  value={formData.libelle}
                  onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
                  placeholder="ex: Automobile, Habitation..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du type de sinistre"
                />
              </div>
              <div>
                <Label htmlFor="ordre">Ordre d'affichage</Label>
                <Input
                  id="ordre"
                  type="number"
                  value={formData.ordre_affichage}
                  onChange={(e) => setFormData(prev => ({ ...prev, ordre_affichage: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="actif"
                  checked={formData.actif}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, actif: checked }))}
                />
                <Label htmlFor="actif">Actif</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isCreatingTypeSinistre}>
                  Créer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {typesSinistres.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun type de sinistre configuré
            </p>
          ) : (
            typesSinistres
              .sort((a, b) => a.ordre_affichage - b.ordre_affichage)
              .map((type) => (
                <Card key={type.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{type.libelle}</h3>
                        <Badge variant="outline">{type.code}</Badge>
                        <Badge variant={type.actif ? "default" : "secondary"}>
                          {type.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      {type.description && (
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Ordre: {type.ordre_affichage}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveType(type, 'up')}
                        disabled={isUpdatingTypeSinistre}
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveType(type, 'down')}
                        disabled={isUpdatingTypeSinistre}
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                      
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(type)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Modifier le type de sinistre</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="edit-code">Code *</Label>
                              <Input
                                id="edit-code"
                                value={formData.code}
                                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-libelle">Libellé *</Label>
                              <Input
                                id="edit-libelle"
                                value={formData.libelle}
                                onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-ordre">Ordre d'affichage</Label>
                              <Input
                                id="edit-ordre"
                                type="number"
                                value={formData.ordre_affichage}
                                onChange={(e) => setFormData(prev => ({ ...prev, ordre_affichage: parseInt(e.target.value) || 0 }))}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="edit-actif"
                                checked={formData.actif}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, actif: checked }))}
                              />
                              <Label htmlFor="edit-actif">Actif</Label>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Annuler
                              </Button>
                              <Button type="submit" disabled={isUpdatingTypeSinistre}>
                                Modifier
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le type de sinistre</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer "{type.libelle}" ? 
                              Cette action supprimera également toutes les associations avec les types de courriers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(type.id)}
                              disabled={isDeletingTypeSinistre}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};