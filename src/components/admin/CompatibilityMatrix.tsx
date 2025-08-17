import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTypesManagement } from "@/hooks/useTypesManagement";
import { Loader2 } from "lucide-react";

export const CompatibilityMatrix = () => {
  const { 
    typesSinistres, 
    typesCourriers, 
    mappings,
    loadingSinistres, 
    loadingCourriers, 
    loadingMappings,
    updateMapping,
    isUpdatingMapping
  } = useTypesManagement();

  const isLoading = loadingSinistres || loadingCourriers || loadingMappings;

  const getMappingStatus = (sinistreId: string, courrierId: string): boolean => {
    const mapping = mappings.find(
      m => m.type_sinistre_id === sinistreId && m.type_courrier_id === courrierId
    );
    return mapping?.actif || false;
  };

  const handleToggleMapping = (sinistreId: string, courrierId: string, currentStatus: boolean) => {
    updateMapping({
      typeSinistreId: sinistreId,
      typeCourrieId: courrierId,
      actif: !currentStatus
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Chargement de la matrice de compatibilité...
        </CardContent>
      </Card>
    );
  }

  const activeSinistres = typesSinistres
    .filter(s => s.actif)
    .sort((a, b) => a.ordre_affichage - b.ordre_affichage);
    
  const activeCourriers = typesCourriers
    .filter(c => c.actif)
    .sort((a, b) => a.ordre_affichage - b.ordre_affichage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matrice de Compatibilité</CardTitle>
        <p className="text-sm text-muted-foreground">
          Définissez quels types de courriers sont autorisés pour chaque type de sinistre
        </p>
      </CardHeader>
      <CardContent>
        {activeSinistres.length === 0 || activeCourriers.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            Veuillez d'abord créer des types de sinistres et de courriers actifs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-4 border-b font-semibold">
                    Type de Sinistre
                  </th>
                  {activeCourriers.map((courrier) => (
                    <th key={courrier.id} className="text-center p-4 border-b font-semibold min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm">{courrier.libelle}</span>
                        <Badge variant="outline" className="text-xs">
                          {courrier.code}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeSinistres.map((sinistre) => {
                  const compatibleCourriers = activeCourriers.filter(c => 
                    getMappingStatus(sinistre.id, c.id)
                  ).length;
                  
                  return (
                    <tr key={sinistre.id} className="hover:bg-muted/50">
                      <td className="p-4 border-b">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sinistre.libelle}</span>
                            <Badge variant="outline">{sinistre.code}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {compatibleCourriers} courrier{compatibleCourriers > 1 ? 's' : ''} autorisé{compatibleCourriers > 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      {activeCourriers.map((courrier) => {
                        const isActive = getMappingStatus(sinistre.id, courrier.id);
                        return (
                          <td key={courrier.id} className="p-4 border-b text-center">
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => handleToggleMapping(sinistre.id, courrier.id, isActive)}
                              disabled={isUpdatingMapping}
                              aria-label={`${isActive ? 'Désactiver' : 'Activer'} l'association ${sinistre.libelle} - ${courrier.libelle}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">Instructions</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Activez les associations pour autoriser un type de courrier pour un type de sinistre</li>
            <li>• Les utilisateurs ne verront que les modèles de courriers autorisés pour leur type de sinistre</li>
            <li>• Vous pouvez modifier ces associations à tout moment</li>
            <li>• Les types inactifs n'apparaissent pas dans cette matrice</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};