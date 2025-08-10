export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_invitations: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          invite_code: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invite_code: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      configuration: {
        Row: {
          cle: string
          description: string | null
          id: string
          modifiable: boolean
          type: Database["public"]["Enums"]["config_type"]
          updated_at: string
          updated_by: string | null
          valeur: string
        }
        Insert: {
          cle: string
          description?: string | null
          id?: string
          modifiable?: boolean
          type: Database["public"]["Enums"]["config_type"]
          updated_at?: string
          updated_by?: string | null
          valeur: string
        }
        Update: {
          cle?: string
          description?: string | null
          id?: string
          modifiable?: boolean
          type?: Database["public"]["Enums"]["config_type"]
          updated_at?: string
          updated_by?: string | null
          valeur?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuration_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courriers_projets: {
        Row: {
          admin_validateur: string | null
          contenu_final: string | null
          contenu_genere: string
          cout_envoi: number | null
          created_at: string
          date_creation: string
          date_envoi: string | null
          date_validation: string | null
          dossier_id: string
          id: string
          numero_suivi: string | null
          reference_laposte: string | null
          statut: Database["public"]["Enums"]["statut_courrier"]
          type_courrier: Database["public"]["Enums"]["type_courrier"]
          updated_at: string
        }
        Insert: {
          admin_validateur?: string | null
          contenu_final?: string | null
          contenu_genere: string
          cout_envoi?: number | null
          created_at?: string
          date_creation?: string
          date_envoi?: string | null
          date_validation?: string | null
          dossier_id: string
          id?: string
          numero_suivi?: string | null
          reference_laposte?: string | null
          statut?: Database["public"]["Enums"]["statut_courrier"]
          type_courrier: Database["public"]["Enums"]["type_courrier"]
          updated_at?: string
        }
        Update: {
          admin_validateur?: string | null
          contenu_final?: string | null
          contenu_genere?: string
          cout_envoi?: number | null
          created_at?: string
          date_creation?: string
          date_envoi?: string | null
          date_validation?: string | null
          dossier_id?: string
          id?: string
          numero_suivi?: string | null
          reference_laposte?: string | null
          statut?: Database["public"]["Enums"]["statut_courrier"]
          type_courrier?: Database["public"]["Enums"]["type_courrier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courriers_projets_admin_validateur_fkey"
            columns: ["admin_validateur"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courriers_projets_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_log: {
        Row: {
          action: string
          created_at: string | null
          document_id: string
          dossier_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          document_id: string
          dossier_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          document_id?: string
          dossier_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          dossier_id: string
          id: string
          mime_type: string
          nom_fichier: string
          taille_fichier: number
          type_document: Database["public"]["Enums"]["type_document"]
          uploaded_by: string
          url_stockage: string
        }
        Insert: {
          created_at?: string
          dossier_id: string
          id?: string
          mime_type: string
          nom_fichier: string
          taille_fichier: number
          type_document: Database["public"]["Enums"]["type_document"]
          uploaded_by: string
          url_stockage: string
        }
        Update: {
          created_at?: string
          dossier_id?: string
          id?: string
          mime_type?: string
          nom_fichier?: string
          taille_fichier?: number
          type_document?: Database["public"]["Enums"]["type_document"]
          uploaded_by?: string
          url_stockage?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dossiers: {
        Row: {
          adresse_assureur: Json | null
          client_id: string
          compagnie_assurance: string
          created_at: string
          date_sinistre: string
          id: string
          montant_refuse: number
          motif_refus: string | null
          police_number: string
          refus_date: string
          statut: Database["public"]["Enums"]["statut_dossier"]
          type_sinistre: Database["public"]["Enums"]["type_sinistre"]
          updated_at: string
        }
        Insert: {
          adresse_assureur?: Json | null
          client_id: string
          compagnie_assurance: string
          created_at?: string
          date_sinistre: string
          id?: string
          montant_refuse: number
          motif_refus?: string | null
          police_number: string
          refus_date: string
          statut?: Database["public"]["Enums"]["statut_dossier"]
          type_sinistre: Database["public"]["Enums"]["type_sinistre"]
          updated_at?: string
        }
        Update: {
          adresse_assureur?: Json | null
          client_id?: string
          compagnie_assurance?: string
          created_at?: string
          date_sinistre?: string
          id?: string
          montant_refuse?: number
          motif_refus?: string | null
          police_number?: string
          refus_date?: string
          statut?: Database["public"]["Enums"]["statut_dossier"]
          type_sinistre?: Database["public"]["Enums"]["type_sinistre"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      echeances: {
        Row: {
          created_at: string
          date_alerte: string | null
          date_limite: string
          description: string | null
          dossier_id: string
          id: string
          notifie: boolean
          statut: Database["public"]["Enums"]["statut_echeance"]
          type_echeance: Database["public"]["Enums"]["type_echeance"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_alerte?: string | null
          date_limite: string
          description?: string | null
          dossier_id: string
          id?: string
          notifie?: boolean
          statut?: Database["public"]["Enums"]["statut_echeance"]
          type_echeance: Database["public"]["Enums"]["type_echeance"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_alerte?: string | null
          date_limite?: string
          description?: string | null
          dossier_id?: string
          id?: string
          notifie?: boolean
          statut?: Database["public"]["Enums"]["statut_echeance"]
          type_echeance?: Database["public"]["Enums"]["type_echeance"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "echeances_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          dossier_id: string
          id: string
          is_read: boolean
          message_type: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          dossier_id: string
          id?: string
          is_read?: boolean
          message_type?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          dossier_id?: string
          id?: string
          is_read?: boolean
          message_type?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      modeles_courriers: {
        Row: {
          actif: boolean
          created_at: string
          created_by: string | null
          id: string
          nom_modele: string
          template_content: string
          type_courrier: Database["public"]["Enums"]["type_courrier"]
          type_sinistre: Database["public"]["Enums"]["type_sinistre"]
          updated_at: string
          variables_requises: Json
        }
        Insert: {
          actif?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nom_modele: string
          template_content: string
          type_courrier: Database["public"]["Enums"]["type_courrier"]
          type_sinistre: Database["public"]["Enums"]["type_sinistre"]
          updated_at?: string
          variables_requises?: Json
        }
        Update: {
          actif?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nom_modele?: string
          template_content?: string
          type_courrier?: Database["public"]["Enums"]["type_courrier"]
          type_sinistre?: Database["public"]["Enums"]["type_sinistre"]
          updated_at?: string
          variables_requises?: Json
        }
        Relationships: [
          {
            foreignKeyName: "modeles_courriers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          devise: string
          dossier_id: string | null
          id: string
          metadata: Json | null
          montant: number
          statut: Database["public"]["Enums"]["statut_paiement"]
          stripe_payment_intent_id: string
          type_facturation: Database["public"]["Enums"]["type_facturation"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          devise?: string
          dossier_id?: string | null
          id?: string
          metadata?: Json | null
          montant: number
          statut?: Database["public"]["Enums"]["statut_paiement"]
          stripe_payment_intent_id: string
          type_facturation: Database["public"]["Enums"]["type_facturation"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          devise?: string
          dossier_id?: string | null
          id?: string
          metadata?: Json | null
          montant?: number
          statut?: Database["public"]["Enums"]["statut_paiement"]
          stripe_payment_intent_id?: string
          type_facturation?: Database["public"]["Enums"]["type_facturation"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          event: string
          id: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          event: string
          id?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          event?: string
          id?: string
          url?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          attempt_number: number
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          response_body: string | null
          status: string
          webhook_url: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          error_message?: string | null
          id?: string
          payload: Json
          response_body?: string | null
          status: string
          webhook_url: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          response_body?: string | null
          status?: string
          webhook_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_dossier: {
        Args: { dossier_id: string; user_id: string }
        Returns: boolean
      }
      can_access_dossier_safe: {
        Args: { dossier_id: string; user_id: string }
        Returns: boolean
      }
      create_dossier_secure: {
        Args: {
          p_client_id: string
          p_type_sinistre: Database["public"]["Enums"]["type_sinistre"]
          p_date_sinistre: string
          p_montant_refuse: number
          p_refus_date: string
          p_police_number: string
          p_compagnie_assurance: string
          p_motif_refus?: string
          p_adresse_assureur?: Json
        }
        Returns: string
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string }
        Returns: string
      }
      diagnose_auth_state: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      dossier_json: {
        Args: { p_dossier_id: string }
        Returns: Json
      }
      encrypt_sensitive_data: {
        Args: { data: string }
        Returns: string
      }
      generate_admin_invite: {
        Args: { admin_email: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_owner: {
        Args: { dossier_id: string; user_id: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          action_type: string
          target_user?: string
          action_details?: Json
        }
        Returns: undefined
      }
      notify_make_webhook: {
        Args: { webhook_url: string; payload_json: Json; max_retries?: number }
        Returns: boolean
      }
      notify_webhook_by_event: {
        Args: { event_name: string; payload_json: Json; max_retries?: number }
        Returns: boolean
      }
      profile_json: {
        Args: { p_user_id: string }
        Returns: Json
      }
      secure_change_user_role: {
        Args: {
          target_user_id: string
          new_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      verify_auth_before_insert: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      config_type: "string" | "number" | "boolean" | "json"
      statut_courrier:
        | "en_attente_validation"
        | "valide_pret_envoi"
        | "modifie_pret_envoi"
        | "envoye"
        | "rejete"
      statut_dossier:
        | "nouveau"
        | "en_cours"
        | "reclamation_envoyee"
        | "mediation"
        | "clos"
      statut_echeance: "actif" | "traite" | "expire"
      statut_paiement:
        | "pending"
        | "succeeded"
        | "failed"
        | "canceled"
        | "refunded"
      type_courrier: "reclamation_interne" | "mediation" | "mise_en_demeure"
      type_document:
        | "refus_assurance"
        | "police"
        | "facture"
        | "expertise"
        | "autre"
      type_echeance:
        | "reponse_reclamation"
        | "delai_mediation"
        | "prescription_biennale"
      type_facturation: "forfait_recours" | "abonnement_mensuel"
      type_sinistre: "auto" | "habitation" | "sante" | "autre"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      config_type: ["string", "number", "boolean", "json"],
      statut_courrier: [
        "en_attente_validation",
        "valide_pret_envoi",
        "modifie_pret_envoi",
        "envoye",
        "rejete",
      ],
      statut_dossier: [
        "nouveau",
        "en_cours",
        "reclamation_envoyee",
        "mediation",
        "clos",
      ],
      statut_echeance: ["actif", "traite", "expire"],
      statut_paiement: [
        "pending",
        "succeeded",
        "failed",
        "canceled",
        "refunded",
      ],
      type_courrier: ["reclamation_interne", "mediation", "mise_en_demeure"],
      type_document: [
        "refus_assurance",
        "police",
        "facture",
        "expertise",
        "autre",
      ],
      type_echeance: [
        "reponse_reclamation",
        "delai_mediation",
        "prescription_biennale",
      ],
      type_facturation: ["forfait_recours", "abonnement_mensuel"],
      type_sinistre: ["auto", "habitation", "sante", "autre"],
    },
  },
} as const
