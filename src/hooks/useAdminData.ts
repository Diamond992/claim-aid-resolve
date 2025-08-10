
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminData = () => {
  // Fetch courriers data
  const { data: courriers = [], isLoading: courriersLoading } = useQuery({
    queryKey: ['admin-courriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courriers_projets')
        .select(`
          *,
          dossier:dossiers (
            client_id,
            compagnie_assurance,
            type_sinistre,
            montant_refuse,
            profiles (
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch echeances data
  const { data: echeances = [], isLoading: echeancesLoading } = useQuery({
    queryKey: ['admin-echeances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('echeances')
        .select(`
          *,
          dossier:dossiers (
            compagnie_assurance,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .order('date_limite', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch payments data
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('paiements')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email
          ),
          dossier:dossiers (
            compagnie_assurance
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch minimal dossiers data only for echeances creation
  const { data: dossiers = [] } = useQuery({
    queryKey: ['admin-dossiers-minimal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          compagnie_assurance,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('statut', 'en_cours') // Only fetch active cases
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch all dossiers with full details for admin management
  const { data: allDossiers = [], isLoading: dossiersLoading } = useQuery({
    queryKey: ['admin-all-dossiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            email
          ),
          documents:documents (
            id,
            nom_fichier,
            type_document,
            created_at,
            url_stockage,
            mime_type,
            taille_fichier,
            uploaded_by
          ),
          courriers:courriers_projets (
            id,
            type_courrier,
            statut,
            created_at
          ),
          echeances:echeances (
            id,
            type_echeance,
            statut,
            date_limite
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch templates data
  const { data: templates = [] } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modeles_courriers')
        .select('*')
        .order('nom_modele', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const isLoading = courriersLoading || echeancesLoading || paymentsLoading || dossiersLoading;

  return {
    courriers,
    echeances,
    payments,
    dossiers,
    allDossiers,
    templates,
    isLoading,
  };
};
