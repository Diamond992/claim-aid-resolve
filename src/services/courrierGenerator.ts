import { supabase } from "@/integrations/supabase/client";

export interface TemplateVariable {
  key: string;
  value: string;
  required: boolean;
}

export interface DossierData {
  id: string;
  client_id: string;
  type_sinistre: string; // Changed from enum to string to support dynamic types
  date_sinistre: string;
  montant_refuse: number;
  refus_date: string;
  police_number: string;
  compagnie_assurance: string;
  motif_refus?: string;
  adresse_assureur?: any;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Interface for dynamic types
interface TypeSinistre {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
}

interface TypeCourrier {
  id: string;
  code: string;
  libelle: string;
  actif: boolean;
}

export class CourrierGenerator {
  private static getVariableMapping(dossier: DossierData, typeSinistreLabel: string): Record<string, string> {
    return {
      'nom_client': `${dossier.profiles.first_name} ${dossier.profiles.last_name}`,
      'prenom_client': dossier.profiles.first_name,
      'nom_famille_client': dossier.profiles.last_name,
      'email_client': dossier.profiles.email,
      'montant_refuse': dossier.montant_refuse.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
      'montant_refuse_chiffres': dossier.montant_refuse.toString(),
      'date_sinistre': new Date(dossier.date_sinistre).toLocaleDateString('fr-FR'),
      'date_sinistre_longue': new Date(dossier.date_sinistre).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      'date_refus': new Date(dossier.refus_date).toLocaleDateString('fr-FR'),
      'date_refus_longue': new Date(dossier.refus_date).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      'police_number': dossier.police_number,
      'numero_police': dossier.police_number,
      'compagnie_assurance': dossier.compagnie_assurance,
      'assureur': dossier.compagnie_assurance,
      'motif_refus': dossier.motif_refus || 'Non spécifié',
      'type_sinistre': typeSinistreLabel,
      'date_courrier': new Date().toLocaleDateString('fr-FR'),
      'date_courrier_longue': new Date().toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
    };
  }

  // Récupère le libellé d'un type de sinistre depuis la base
  private static async getTypeSinistreLabel(typeCode: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('types_sinistres')
        .select('libelle')
        .eq('code', typeCode)
        .eq('actif', true)
        .single();

      if (error || !data) {
        // Fallback to legacy mapping
        const legacyLabels: Record<string, string> = {
          'auto': 'Automobile',
          'habitation': 'Habitation',
          'sante': 'Santé',
          'autre': 'Autre'
        };
        return legacyLabels[typeCode] || typeCode;
      }

      return data.libelle;
    } catch (error) {
      console.error('Error fetching type sinistre label:', error);
      return typeCode;
    }
  }

  // Récupère les types de courriers disponibles pour un type de sinistre
  static async getAvailableCourrierTypes(typeSinistreCode: string): Promise<TypeCourrier[]> {
    try {
      const { data, error } = await supabase
        .from('sinistre_courrier_mapping')
        .select(`
          types_courriers!inner(*)
        `)
        .eq('actif', true)
        .eq('types_sinistres.code', typeSinistreCode)
        .eq('types_courriers.actif', true);

      if (error) throw error;

      return data?.map(item => item.types_courriers) || [];
    } catch (error) {
      console.error('Error fetching available courrier types:', error);
      // Fallback to all courrier types
      const { data: allTypes } = await supabase
        .from('types_courriers')
        .select('*')
        .eq('actif', true);
      return allTypes || [];
    }
  }

  // Récupère les modèles disponibles selon les associations dynamiques
  static async getAvailableTemplates(
    typeSinistreCode: string, 
    typeCourrierCode?: string
  ) {
    try {
      // First get the type sinistre and courrier IDs
      const { data: sinistreData } = await supabase
        .from('types_sinistres')
        .select('id')
        .eq('code', typeSinistreCode)
        .eq('actif', true)
        .single();

      if (!sinistreData) {
        console.warn(`Type sinistre not found: ${typeSinistreCode}`);
        return [];
      }

      let courrierFilter = '';
      if (typeCourrierCode) {
        const { data: courrierData } = await supabase
          .from('types_courriers')
          .select('id')
          .eq('code', typeCourrierCode)
          .eq('actif', true)
          .single();

        if (!courrierData) {
          console.warn(`Type courrier not found: ${typeCourrierCode}`);
          return [];
        }
        courrierFilter = `.eq('type_courrier_id', '${courrierData.id}')`;
      }

      // Get templates through the mapping table
      const { data, error } = await supabase
        .from('modeles_courriers')
        .select(`
          *,
          types_sinistres!inner(code, libelle),
          types_courriers!inner(code, libelle)
        `)
        .eq('actif', true)
        .eq('types_sinistres.code', typeSinistreCode);

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      // Filter by courrier type if specified
      let filteredData = data || [];
      if (typeCourrierCode) {
        filteredData = filteredData.filter(template => 
          template.types_courriers?.code === typeCourrierCode
        );
      }

      return filteredData;
    } catch (error) {
      console.error('Error in getAvailableTemplates:', error);
      return [];
    }
  }

  static extractRequiredVariables(templateContent: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(templateContent)) !== null) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  }

  static async analyzeTemplateVariables(templateContent: string, dossier: DossierData) {
    const requiredVariables = this.extractRequiredVariables(templateContent);
    const typeSinistreLabel = await this.getTypeSinistreLabel(dossier.type_sinistre);
    const autoMapping = this.getVariableMapping(dossier, typeSinistreLabel);
    
    const automaticVariables: TemplateVariable[] = [];
    const manualVariables: TemplateVariable[] = [];

    requiredVariables.forEach(variable => {
      if (autoMapping[variable]) {
        automaticVariables.push({
          key: variable,
          value: autoMapping[variable],
          required: true
        });
      } else {
        manualVariables.push({
          key: variable,
          value: '',
          required: true
        });
      }
    });

    return { automaticVariables, manualVariables };
  }

  static async generateContent(
    templateContent: string,
    dossier: DossierData,
    manualVariables: Record<string, string> = {}
  ): Promise<string> {
    const typeSinistreLabel = await this.getTypeSinistreLabel(dossier.type_sinistre);
    const autoMapping = this.getVariableMapping(dossier, typeSinistreLabel);
    let content = templateContent;

    // Replace automatic variables
    Object.entries(autoMapping).forEach(([key, value]) => {
      const variable = `{{${key}}}`;
      content = content.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    // Replace manual variables
    Object.entries(manualVariables).forEach(([key, value]) => {
      const variable = `{{${key}}}`;
      content = content.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return content;
  }

  static async createCourrier(
    dossierId: string,
    templateId: string,
    typeCourrier: string,
    contenuGenere: string
  ) {
    const { data, error } = await supabase
      .from('courriers_projets')
      .insert({
        dossier_id: dossierId,
        type_courrier: typeCourrier,
        contenu_genere: contenuGenere,
        statut: 'en_attente_validation'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}