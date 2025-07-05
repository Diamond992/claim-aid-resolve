
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Save, Settings } from "lucide-react";
import { useConfiguration, Configuration } from "@/hooks/useConfiguration";

const ConfigurationList = () => {
  const { configurations, isLoading, updateConfiguration, isUpdating } = useConfiguration();
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'boolean': return 'bg-purple-100 text-purple-800';
      case 'json': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (config: Configuration) => {
    switch (config.type) {
      case 'boolean':
        return config.valeur === 'true' ? 'Activé' : 'Désactivé';
      case 'number':
        if (config.cle === 'cout_lrar') {
          return `${config.valeur} €`;
        }
        if (config.cle === 'delai_reponse_assureur') {
          return `${config.valeur} jours`;
        }
        if (config.cle === 'delai_prescription') {
          return `${config.valeur} ans`;
        }
        return config.valeur;
      default:
        return config.valeur;
    }
  };

  const handleValueChange = (configId: string, newValue: string) => {
    setEditingValues(prev => ({
      ...prev,
      [configId]: newValue
    }));
  };

  const handleSave = (config: Configuration) => {
    const newValue = editingValues[config.id];
    if (newValue !== undefined && newValue !== config.valeur) {
      updateConfiguration({ id: config.id, valeur: newValue });
      setEditingValues(prev => {
        const updated = { ...prev };
        delete updated[config.id];
        return updated;
      });
    }
  };

  const renderEditableValue = (config: Configuration) => {
    const currentValue = editingValues[config.id] ?? config.valeur;
    const hasChanges = editingValues[config.id] !== undefined && editingValues[config.id] !== config.valeur;

    if (!config.modifiable) {
      return (
        <div className="text-gray-600">
          {formatValue(config)}
          <Badge variant="secondary" className="ml-2 text-xs">Non modifiable</Badge>
        </div>
      );
    }

    switch (config.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={currentValue === 'true'}
              onCheckedChange={(checked) => handleValueChange(config.id, checked ? 'true' : 'false')}
            />
            <span>{currentValue === 'true' ? 'Activé' : 'Désactivé'}</span>
            {hasChanges && (
              <Button
                size="sm"
                onClick={() => handleSave(config)}
                disabled={isUpdating}
                className="ml-2"
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      
      case 'json':
        return (
          <div className="space-y-2">
            <Textarea
              value={currentValue}
              onChange={(e) => handleValueChange(config.id, e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
            {hasChanges && (
              <Button
                size="sm"
                onClick={() => handleSave(config)}
                disabled={isUpdating}
              >
                <Save className="h-3 w-3 mr-1" />
                Sauvegarder
              </Button>
            )}
          </div>
        );
      
      default:
        return (
          <div className="flex items-center space-x-2">
            <Input
              type={config.type === 'number' ? 'number' : 'text'}
              value={currentValue}
              onChange={(e) => handleValueChange(config.id, e.target.value)}
              className="max-w-xs"
            />
            {hasChanges && (
              <Button
                size="sm"
                onClick={() => handleSave(config)}
                disabled={isUpdating}
              >
                <Save className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Chargement des configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Configuration Système</h2>
      </div>

      <div className="grid gap-4">
        {configurations.map((config) => (
          <Card key={config.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{config.cle}</CardTitle>
                  {config.description && (
                    <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                  )}
                </div>
                <Badge className={getTypeColor(config.type)}>
                  {config.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Valeur actuelle :</Label>
                  <div className="mt-1">
                    {renderEditableValue(config)}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Dernière mise à jour : {new Date(config.updated_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {configurations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Aucune configuration trouvée</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConfigurationList;
