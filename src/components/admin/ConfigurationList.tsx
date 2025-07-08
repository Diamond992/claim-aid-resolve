
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Save, Settings, Lock } from "lucide-react";
import { useState } from "react";
import { useConfiguration } from "@/hooks/useConfiguration";
import { useUserRole } from "@/hooks/useUserRole";

const ConfigurationList = () => {
  const { configurations, isLoading, updateConfiguration, isUpdating } = useConfiguration();
  const { isAdmin } = useUserRole();
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const handleInputChange = (id: string, value: string) => {
    setEditingValues(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSave = (id: string) => {
    const newValue = editingValues[id];
    if (newValue !== undefined) {
      updateConfiguration({ id, valeur: newValue });
      setEditingValues(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'number':
        return 'bg-blue-100 text-blue-800';
      case 'boolean':
        return 'bg-green-100 text-green-800';
      case 'json':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div>Chargement de la configuration...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Accès Restreint</h3>
          <p className="text-gray-600">
            Seuls les administrateurs peuvent accéder à la configuration système.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Configuration Système</h2>
      </div>

      <div className="grid gap-4">
        {configurations.map((config) => (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{config.cle}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(config.type)}>
                    {config.type}
                  </Badge>
                  {!config.modifiable && (
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      <Lock className="h-3 w-3 mr-1" />
                      Verrouillé
                    </Badge>
                  )}
                </div>
              </div>
              {config.description && (
                <CardDescription>{config.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`config-${config.id}`}>Valeur</Label>
                    <Input
                      id={`config-${config.id}`}
                      type={config.type === 'number' ? 'number' : 'text'}
                      value={editingValues[config.id] ?? config.valeur}
                      onChange={(e) => handleInputChange(config.id, e.target.value)}
                      disabled={!config.modifiable}
                      className={!config.modifiable ? 'bg-gray-50' : ''}
                    />
                  </div>
                  {config.modifiable && (
                    <Button
                      onClick={() => handleSave(config.id)}
                      disabled={
                        isUpdating || 
                        editingValues[config.id] === undefined || 
                        editingValues[config.id] === config.valeur
                      }
                      size="sm"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {config.profiles && (
                  <div className="text-xs text-gray-500">
                    Dernière modification par: {config.profiles.first_name} {config.profiles.last_name}
                    <br />
                    Le: {new Date(config.updated_at).toLocaleString('fr-FR')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConfigurationList;
