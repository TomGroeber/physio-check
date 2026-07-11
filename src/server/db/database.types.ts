export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          address: string
          created_at: string
          ends_at: string
          id: string
          location_name: string
          note: string
          patient_profile_id: string
          practice_id: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          therapist_member_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string
          created_at?: string
          ends_at: string
          id?: string
          location_name?: string
          note?: string
          patient_profile_id: string
          practice_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          therapist_member_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          ends_at?: string
          id?: string
          location_name?: string
          note?: string
          patient_profile_id?: string
          practice_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          therapist_member_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_therapist_member_id_fkey"
            columns: ["therapist_member_id"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          metadata: Json
          practice_id: string | null
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          metadata?: Json
          practice_id?: string | null
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          metadata?: Json
          practice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_requests: {
        Row: {
          appointment_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          reason: string
          requested_by: string
          status: Database["public"]["Enums"]["cancellation_status"]
        }
        Insert: {
          appointment_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          reason?: string
          requested_by: string
          status?: Database["public"]["Enums"]["cancellation_status"]
        }
        Update: {
          appointment_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          reason?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["cancellation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      completion_logs: {
        Row: {
          created_at: string
          id: string
          note: string
          pain_after: number | null
          pain_before: number | null
          patient_profile_id: string
          performed_at: string
          performed_on: string
          plan_item_id: string
          prescription_snapshot: Json
          sets_completed: number | null
          status: Database["public"]["Enums"]["completion_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          pain_after?: number | null
          pain_before?: number | null
          patient_profile_id: string
          performed_at?: string
          performed_on: string
          plan_item_id: string
          prescription_snapshot?: Json
          sets_completed?: number | null
          status: Database["public"]["Enums"]["completion_status"]
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          pain_after?: number | null
          pain_before?: number | null
          patient_profile_id?: string
          performed_at?: string
          performed_on?: string
          plan_item_id?: string
          prescription_snapshot?: Json
          sets_completed?: number | null
          status?: Database["public"]["Enums"]["completion_status"]
        }
        Relationships: [
          {
            foreignKeyName: "completion_logs_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completion_logs_plan_item_id_fkey"
            columns: ["plan_item_id"]
            isOneToOne: false
            referencedRelation: "exercise_plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consented_at: string
          document_type: string
          document_version: string
          id: string
          profile_id: string
        }
        Insert: {
          consented_at?: string
          document_type: string
          document_version: string
          id?: string
          profile_id: string
        }
        Update: {
          consented_at?: string
          document_type?: string
          document_version?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_media: {
        Row: {
          created_at: string
          duration_seconds: number | null
          exercise_id: string
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime_type: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime_type: string
          size_bytes?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_media_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_plan_items: {
        Row: {
          end_date: string | null
          exercise_id: string
          hold_seconds: number | null
          id: string
          note: string
          plan_version_id: string
          repetitions: number | null
          rest_seconds: number | null
          schedule: Json
          sets: number | null
          sort_order: number
          start_date: string
          total_duration_seconds: number | null
        }
        Insert: {
          end_date?: string | null
          exercise_id: string
          hold_seconds?: number | null
          id?: string
          note?: string
          plan_version_id: string
          repetitions?: number | null
          rest_seconds?: number | null
          schedule?: Json
          sets?: number | null
          sort_order?: number
          start_date: string
          total_duration_seconds?: number | null
        }
        Update: {
          end_date?: string | null
          exercise_id?: string
          hold_seconds?: number | null
          id?: string
          note?: string
          plan_version_id?: string
          repetitions?: number | null
          rest_seconds?: number | null
          schedule?: Json
          sets?: number | null
          sort_order?: number
          start_date?: string
          total_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_plan_items_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_plan_items_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "exercise_plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_plan_versions: {
        Row: {
          change_note: string
          created_at: string
          created_by: string | null
          id: string
          plan_id: string
          version_number: number
        }
        Insert: {
          change_note?: string
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id: string
          version_number: number
        }
        Update: {
          change_note?: string
          created_at?: string
          created_by?: string | null
          id?: string
          plan_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_plan_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "exercise_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_plans: {
        Row: {
          created_at: string
          created_by: string | null
          current_version_id: string | null
          id: string
          patient_profile_id: string
          practice_id: string
          status: Database["public"]["Enums"]["plan_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          id?: string
          patient_profile_id: string
          practice_id: string
          status?: Database["public"]["Enums"]["plan_status"]
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          id?: string
          patient_profile_id?: string
          practice_id?: string
          status?: Database["public"]["Enums"]["plan_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_plans_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "exercise_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_plans_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_plans_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          common_mistakes: string
          created_at: string
          created_by: string | null
          default_dosage_type: Database["public"]["Enums"]["dosage_type"]
          default_hold_seconds: number | null
          default_repetitions: number | null
          default_rest_seconds: number | null
          default_sets: number | null
          description: string
          equipment: string
          id: string
          is_active: boolean
          practice_id: string
          starting_position: string
          steps: Json
          title: string
          updated_at: string
        }
        Insert: {
          common_mistakes?: string
          created_at?: string
          created_by?: string | null
          default_dosage_type?: Database["public"]["Enums"]["dosage_type"]
          default_hold_seconds?: number | null
          default_repetitions?: number | null
          default_rest_seconds?: number | null
          default_sets?: number | null
          description?: string
          equipment?: string
          id?: string
          is_active?: boolean
          practice_id: string
          starting_position?: string
          steps?: Json
          title: string
          updated_at?: string
        }
        Update: {
          common_mistakes?: string
          created_at?: string
          created_by?: string | null
          default_dosage_type?: Database["public"]["Enums"]["dosage_type"]
          default_hold_seconds?: number | null
          default_repetitions?: number | null
          default_rest_seconds?: number | null
          default_sets?: number | null
          description?: string
          equipment?: string
          id?: string
          is_active?: boolean
          practice_id?: string
          starting_position?: string
          steps?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_redemption_attempts: {
        Row: {
          actor_hash: string
          attempted_at: string
          id: number
          successful: boolean
        }
        Insert: {
          actor_hash: string
          attempted_at?: string
          id?: never
          successful?: boolean
        }
        Update: {
          actor_hash?: string
          attempted_at?: string
          id?: never
          successful?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_profile_id: string
          reference: Json
          title: string
          type: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_profile_id: string
          reference?: Json
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_profile_id?: string
          reference?: Json
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_invites: {
        Row: {
          code_hash: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          patient_display_name: string
          practice_id: string
          revoked_at: string | null
          used_at: string | null
          used_by_profile_id: string | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          patient_display_name: string
          practice_id: string
          revoked_at?: string | null
          used_at?: string | null
          used_by_profile_id?: string | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          patient_display_name?: string
          practice_id?: string
          revoked_at?: string | null
          used_at?: string | null
          used_by_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_invites_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_invites_used_by_profile_id_fkey"
            columns: ["used_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_practice_links: {
        Row: {
          ended_at: string | null
          id: string
          linked_at: string
          patient_profile_id: string
          practice_id: string
          primary_therapist_id: string | null
          status: Database["public"]["Enums"]["link_status"]
        }
        Insert: {
          ended_at?: string | null
          id?: string
          linked_at?: string
          patient_profile_id: string
          practice_id: string
          primary_therapist_id?: string | null
          status?: Database["public"]["Enums"]["link_status"]
        }
        Update: {
          ended_at?: string | null
          id?: string
          linked_at?: string
          patient_profile_id?: string
          practice_id?: string
          primary_therapist_id?: string | null
          status?: Database["public"]["Enums"]["link_status"]
        }
        Relationships: [
          {
            foreignKeyName: "patient_practice_links_patient_profile_id_fkey"
            columns: ["patient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_practice_links_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_practice_links_primary_therapist_id_fkey"
            columns: ["primary_therapist_id"]
            isOneToOne: false
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          practice_id: string
          profile_id: string
          role: Database["public"]["Enums"]["practice_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          practice_id: string
          profile_id: string
          role: Database["public"]["Enums"]["practice_role"]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          practice_id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["practice_role"]
        }
        Relationships: [
          {
            foreignKeyName: "practice_members_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practices: {
        Row: {
          address_city: string
          address_postal_code: string
          address_street: string
          created_at: string
          id: string
          name: string
          phone: string
          settings: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          address_city?: string
          address_postal_code?: string
          address_street?: string
          created_at?: string
          id?: string
          name: string
          phone?: string
          settings?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_city?: string
          address_postal_code?: string
          address_street?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          settings?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_plan: { Args: { p_plan_id: string }; Returns: boolean }
      can_view_profile: { Args: { p_profile_id: string }; Returns: boolean }
      is_linked_patient: { Args: { p_practice_id: string }; Returns: boolean }
      is_practice_admin: { Args: { p_practice_id: string }; Returns: boolean }
      is_practice_member: { Args: { p_practice_id: string }; Returns: boolean }
      member_can_view_patient: {
        Args: { p_patient_id: string }
        Returns: boolean
      }
      patient_can_view_exercise: {
        Args: { p_exercise_id: string }
        Returns: boolean
      }
      redeem_patient_invite: {
        Args: { p_code_hash: string; p_invite_id: string }
        Returns: string
      }
      renew_patient_invite: {
        Args: {
          p_code_hash: string
          p_expires_at: string
          p_invite_id: string
        }
        Returns: string
      }
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "cancellation_requested"
        | "cancelled"
        | "completed"
      cancellation_status: "pending" | "approved" | "rejected"
      completion_status:
        | "completed"
        | "partial"
        | "too_difficult"
        | "not_possible"
      dosage_type: "repetitions" | "duration"
      link_status: "active" | "ended"
      media_kind: "video" | "thumbnail" | "captions" | "fallback_image"
      plan_status: "active" | "archived"
      practice_role: "therapist" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appointment_status: [
        "scheduled",
        "cancellation_requested",
        "cancelled",
        "completed",
      ],
      cancellation_status: ["pending", "approved", "rejected"],
      completion_status: [
        "completed",
        "partial",
        "too_difficult",
        "not_possible",
      ],
      dosage_type: ["repetitions", "duration"],
      link_status: ["active", "ended"],
      media_kind: ["video", "thumbnail", "captions", "fallback_image"],
      plan_status: ["active", "archived"],
      practice_role: ["therapist", "admin"],
    },
  },
} as const
