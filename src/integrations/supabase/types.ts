export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
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
      cohort_invites: {
        Row: {
          cohort_id: string
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          cohort_id: string
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          cohort_id?: string
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_invites_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_members: {
        Row: {
          cohort_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          cohort_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          cohort_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_members_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      founder_invites: {
        Row: {
          claimed_at: string | null
          email: string
          invited_at: string
          name: string | null
        }
        Insert: {
          claimed_at?: string | null
          email: string
          invited_at?: string
          name?: string | null
        }
        Update: {
          claimed_at?: string | null
          email?: string
          invited_at?: string
          name?: string | null
        }
        Relationships: []
      }
      founders: {
        Row: {
          created_at: string
          id: string
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notion_participants: {
        Row: {
          country: string | null
          email: string | null
          full_name: string | null
          job_status: string | null
          mentor: string | null
          notion_page_id: string
          notion_page_url: string | null
          paid_project_1: string | null
          paid_project_2: string | null
          raw: Json
          start_date: string | null
          status: string | null
          synced_at: string
          tenure_years: number | null
          track: string | null
        }
        Insert: {
          country?: string | null
          email?: string | null
          full_name?: string | null
          job_status?: string | null
          mentor?: string | null
          notion_page_id: string
          notion_page_url?: string | null
          paid_project_1?: string | null
          paid_project_2?: string | null
          raw?: Json
          start_date?: string | null
          status?: string | null
          synced_at?: string
          tenure_years?: number | null
          track?: string | null
        }
        Update: {
          country?: string | null
          email?: string | null
          full_name?: string | null
          job_status?: string | null
          mentor?: string | null
          notion_page_id?: string
          notion_page_url?: string | null
          paid_project_1?: string | null
          paid_project_2?: string | null
          raw?: Json
          start_date?: string | null
          status?: string | null
          synced_at?: string
          tenure_years?: number | null
          track?: string | null
        }
        Relationships: []
      }
      notion_sync_state: {
        Row: {
          id: string
          last_error: string | null
          last_status: string | null
          last_synced_at: string | null
          row_count: number | null
          updated_at: string
        }
        Insert: {
          id: string
          last_error?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          row_count?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_synced_at?: string | null
          row_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_updates: {
        Row: {
          blockers: string | null
          created_at: string | null
          date: string
          display_name: string | null
          id: string
          today: string
          tomorrow: string
          user_id: string
        }
        Insert: {
          blockers?: string | null
          created_at?: string | null
          date?: string
          display_name?: string | null
          id?: string
          today: string
          tomorrow: string
          user_id: string
        }
        Update: {
          blockers?: string | null
          created_at?: string | null
          date?: string
          display_name?: string | null
          id?: string
          today?: string
          tomorrow?: string
          user_id?: string
        }
        Relationships: []
      }
      mentors: {
        Row: {
          id: string
          name: string | null
          user_id: string
        }
        Insert: {
          id?: string
          name?: string | null
          user_id: string
        }
        Update: {
          id?: string
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      update_comments: {
        Row: {
          commenter_name: string
          commenter_user_id: string
          created_at: string | null
          id: string
          text: string
          update_date: string
          update_user_id: string
        }
        Insert: {
          commenter_name: string
          commenter_user_id: string
          created_at?: string | null
          id?: string
          text: string
          update_date: string
          update_user_id: string
        }
        Update: {
          commenter_name?: string
          commenter_user_id?: string
          created_at?: string | null
          id?: string
          text?: string
          update_date?: string
          update_user_id?: string
        }
        Relationships: []
      }
      update_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          reactor_user_id: string
          update_date: string
          update_user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          reactor_user_id: string
          update_date: string
          update_user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          reactor_user_id?: string
          update_date?: string
          update_user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          avatar_url: string | null
          checked: Json
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          notes: Json
          onboarded: boolean | null
          streak_count: number
          streak_date: string | null
          submissions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          checked?: Json
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          notes?: Json
          onboarded?: boolean | null
          streak_count?: number
          streak_date?: string | null
          submissions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          checked?: Json
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          notes?: Json
          onboarded?: boolean | null
          streak_count?: number
          streak_date?: string | null
          submissions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cohort_directory: {
        Args: never
        Returns: {
          checked: Json
          display_name: string
          user_id: string
        }[]
      }
      ensure_my_cohort: { Args: never; Returns: string }
      is_founder: { Args: never; Returns: boolean }
      claim_my_role: { Args: never; Returns: string }
      founder_roster: {
        Args: never
        Returns: {
          notion_page_id: string | null
          notion_page_url: string | null
          full_name: string | null
          email: string | null
          country: string | null
          track: string | null
          status: string | null
          start_date: string | null
          mentor: string | null
          paid_project_1: string | null
          paid_project_2: string | null
          job_status: string | null
          user_id: string | null
          app_cohort: string | null
          display_name: string | null
          avatar_url: string | null
          checked: Json
          submissions_count: number | null
          notes_count: number | null
          streak_count: number | null
          joined_app_at: string | null
          last_active: string | null
          updates_total: number
          updates_last_7d: number
          last_update_date: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
