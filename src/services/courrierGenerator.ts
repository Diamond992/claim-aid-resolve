import { supabase } from "@/integrations/supabase/client";

export interface TemplateVariable {
  key: string;
  value: string;
  required: boolean;
}

export interface DossierData {
  id: string;
  client_id: string;
  type_sinistre: 'auto' | 'habitation' | 'sante';
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

export class CourrierGenerator {
  private static getVariableMapping(dossier: DossierData): Record<string, string> {
    return {
      '{{nom_client}}': `${dossier.profiles.first_name} ${dossier.profiles.last_name}`,
      '{{prenom_client}}': dossier.profiles.first_name,
      '{{nom_famille_client}}': dossier.profiles.last_name,
      '{{email_client}}': dossier.profiles.email,
      '{{montant_refuse}}': dossier.montant_refuse.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
      '{{montant_refuse_chiffres}}': dossier.montant_refuse.toString(),
      '{{date_sinistre}}': new Date(dossier.date_sinistre).toLocaleDateString('fr-FR'),
      '{{date_sinistre_longue}}': new Date(dossier.date_sinistre).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      '{{date_refus}}': new Date(dossier.refus_date).toLocaleDateString('fr-FR'),
      '{{date_refus_longue}}': new Date(dossier.refus_date).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      '{{police_number}}': dossier.police_number,
      '{{numero_police}}': dossier.police_number,
      '{{compagnie_assurance}}': dossier.compagnie_assurance,
      '{{assureur}}': dossier.compagnie_assurance,
      '{{motif_refus}}': dossier.motif_refus || 'Non spécifié',
      '{{type_sinistre}}': this.getTypeSinistreLabel(dossier.type_sinistre),
      '{{date_courrier}}': new Date().toLocaleDateString('fr-FR'),
      '{{date_courrier_longue}}': new Date().toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
    };
  }

  private static getTypeSinistreLabel(type: string): string {
    switch (type) {
      case 'auto': return 'Automobile';
      case 'habitation': return 'Habitation';
      case 'sante': return 'Santé';
      default: return type;
    }
  }

  static async getAvailableTemplates(
    typeSinistre: 'auto' | 'habitation' | 'sante',
    typeCourrier: 'reclamation_interne' | 'mediation' | 'mise_en_demeure'
  ) {
    const { data, error } = await supabase
      .from('modeles_courriers')
      .select('*')
      .eq('type_sinistre', typeSinistre)
      .eq('type_courrier', typeCourrier)
      .eq('actif', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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

  static analyzeTemplateVariables(templateContent: string, dossier: DossierData) {
    const requiredVariables = this.extractRequiredVariables(templateContent);
    const autoMapping = this.getVariableMapping(dossier);
    
    const automaticVariables: TemplateVariable[] = [];
    const manualVariables: TemplateVariable[] = [];

    requiredVariables.forEach(variable => {
      const fullVariable = `{{${variable}}}`;
      if (autoMapping[fullVariable]) {
        automaticVariables.push({
          key: variable,
          value: autoMapping[fullVariable],
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

  static generateContent(
    templateContent: string,
    dossier: DossierData,
    manualVariables: Record<string, string> = {}
  ): string {
    const autoMapping = this.getVariableMapping(dossier);
    let content = templateContent;

    // Replace automatic variables
    Object.entries(autoMapping).forEach(([variable, value]) => {
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
    typeCourrier: 'reclamation_interne' | 'mediation' | 'mise_en_demeure',
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