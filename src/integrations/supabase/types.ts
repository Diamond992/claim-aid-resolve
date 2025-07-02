export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_admin_invite: {
        Args: { admin_email: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
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
    }
    Enums: {
      app_role: "admin" | "user"
      statut_dossier:
        | "nouveau"
        | "en_cours"
        | "reclamation_envoyee"
        | "mediation"
        | "clos"
      type_document:
        | "refus_assurance"
        | "police"
        | "facture"
        | "expertise"
        | "autre"
      type_sinistre: "auto" | "habitation" | "sante" | "autre"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      statut_dossier: [
        "nouveau",
        "en_cours",
        "reclamation_envoyee",
        "mediation",
        "clos",
      ],
      type_document: [
        "refus_assurance",
        "police",
        "facture",
        "expertise",
        "autre",
      ],
      type_sinistre: ["auto", "habitation", "sante", "autre"],
    },
  },
} as const
