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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_audit_log: {
        Row: {
          action_description: string | null
          action_type: string
          agent_name: string
          approved_by: string | null
          created_at: string
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          organization_id: string
          output_data: Json | null
          reversed_at: string | null
          risk_score: number | null
          was_approved: boolean | null
          was_reversed: boolean | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          agent_name: string
          approved_by?: string | null
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          organization_id: string
          output_data?: Json | null
          reversed_at?: string | null
          risk_score?: number | null
          was_approved?: boolean | null
          was_reversed?: boolean | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          agent_name?: string
          approved_by?: string | null
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          organization_id?: string
          output_data?: Json | null
          reversed_at?: string | null
          risk_score?: number | null
          was_approved?: boolean | null
          was_reversed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_goals: {
        Row: {
          created_at: string
          current_value: number | null
          deadline: string | null
          description: string | null
          goal_type: string
          id: string
          organization_id: string
          priority: number | null
          status: string | null
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          goal_type: string
          id?: string
          organization_id: string
          priority?: number | null
          status?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          organization_id?: string
          priority?: number | null
          status?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string
          description: string | null
          enabled: boolean | null
          execution_count: number | null
          id: string
          is_reversible: boolean | null
          last_executed_at: string | null
          name: string
          organization_id: string
          requires_approval: boolean | null
          risk_score: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          execution_count?: number | null
          id?: string
          is_reversible?: boolean | null
          last_executed_at?: string | null
          name: string
          organization_id: string
          requires_approval?: boolean | null
          risk_score?: number | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          execution_count?: number | null
          id?: string
          is_reversible?: boolean | null
          last_executed_at?: string | null
          name?: string
          organization_id?: string
          requires_approval?: boolean | null
          risk_score?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_config: {
        Row: {
          base_price: number | null
          booking_link: string | null
          brand_voice: string | null
          closing_style: string | null
          created_at: string
          currency: string | null
          downsell_price: number | null
          id: string
          ideal_deal_value: number | null
          organization_id: string
          product_description: string | null
          product_name: string | null
          referral_bonus: number | null
          referral_discount: number | null
          referral_enabled: boolean | null
          referral_pitch: string | null
          retention_enabled: boolean | null
          save_offer_duration_days: number | null
          save_offer_pitch: string | null
          save_offer_type: string | null
          stripe_downsell_link: string | null
          stripe_payment_link: string | null
          stripe_upsell_link: string | null
          system_persona: string | null
          target_company_size: string | null
          target_location: string | null
          target_niche: string | null
          updated_at: string
          upsell_delay_seconds: number | null
          upsell_enabled: boolean | null
          upsell_name: string | null
          upsell_pitch: string | null
          upsell_price: number | null
        }
        Insert: {
          base_price?: number | null
          booking_link?: string | null
          brand_voice?: string | null
          closing_style?: string | null
          created_at?: string
          currency?: string | null
          downsell_price?: number | null
          id?: string
          ideal_deal_value?: number | null
          organization_id: string
          product_description?: string | null
          product_name?: string | null
          referral_bonus?: number | null
          referral_discount?: number | null
          referral_enabled?: boolean | null
          referral_pitch?: string | null
          retention_enabled?: boolean | null
          save_offer_duration_days?: number | null
          save_offer_pitch?: string | null
          save_offer_type?: string | null
          stripe_downsell_link?: string | null
          stripe_payment_link?: string | null
          stripe_upsell_link?: string | null
          system_persona?: string | null
          target_company_size?: string | null
          target_location?: string | null
          target_niche?: string | null
          updated_at?: string
          upsell_delay_seconds?: number | null
          upsell_enabled?: boolean | null
          upsell_name?: string | null
          upsell_pitch?: string | null
          upsell_price?: number | null
        }
        Update: {
          base_price?: number | null
          booking_link?: string | null
          brand_voice?: string | null
          closing_style?: string | null
          created_at?: string
          currency?: string | null
          downsell_price?: number | null
          id?: string
          ideal_deal_value?: number | null
          organization_id?: string
          product_description?: string | null
          product_name?: string | null
          referral_bonus?: number | null
          referral_discount?: number | null
          referral_enabled?: boolean | null
          referral_pitch?: string | null
          retention_enabled?: boolean | null
          save_offer_duration_days?: number | null
          save_offer_pitch?: string | null
          save_offer_type?: string | null
          stripe_downsell_link?: string | null
          stripe_payment_link?: string | null
          stripe_upsell_link?: string | null
          system_persona?: string | null
          target_company_size?: string | null
          target_location?: string | null
          target_niche?: string | null
          updated_at?: string
          upsell_delay_seconds?: number | null
          upsell_enabled?: boolean | null
          upsell_name?: string | null
          upsell_pitch?: string | null
          upsell_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_snapshots: {
        Row: {
          created_at: string
          id: string
          liquid_assets: number | null
          net_cashflow: number | null
          net_worth: number | null
          organization_id: string
          runway_months: number | null
          savings_rate: number | null
          snapshot_date: string
          total_assets: number | null
          total_expenses: number | null
          total_income: number | null
          total_liabilities: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          liquid_assets?: number | null
          net_cashflow?: number | null
          net_worth?: number | null
          organization_id: string
          runway_months?: number | null
          savings_rate?: number | null
          snapshot_date: string
          total_assets?: number | null
          total_expenses?: number | null
          total_income?: number | null
          total_liabilities?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          liquid_assets?: number | null
          net_cashflow?: number | null
          net_worth?: number | null
          organization_id?: string
          runway_months?: number | null
          savings_rate?: number | null
          snapshot_date?: string
          total_assets?: number | null
          total_expenses?: number | null
          total_income?: number | null
          total_liabilities?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_pipeline: {
        Row: {
          asymmetry_ratio: number | null
          conviction_score: number | null
          created_at: string
          description: string | null
          discovered_at: string | null
          downside_risk: number | null
          id: string
          invalidation_triggers: string[] | null
          opportunity_type: string
          organization_id: string
          source: string | null
          status: string | null
          thesis: string | null
          title: string
          updated_at: string
          upside_potential: number | null
          why_not: string | null
          why_now: string | null
        }
        Insert: {
          asymmetry_ratio?: number | null
          conviction_score?: number | null
          created_at?: string
          description?: string | null
          discovered_at?: string | null
          downside_risk?: number | null
          id?: string
          invalidation_triggers?: string[] | null
          opportunity_type: string
          organization_id: string
          source?: string | null
          status?: string | null
          thesis?: string | null
          title: string
          updated_at?: string
          upside_potential?: number | null
          why_not?: string | null
          why_now?: string | null
        }
        Update: {
          asymmetry_ratio?: number | null
          conviction_score?: number | null
          created_at?: string
          description?: string | null
          discovered_at?: string | null
          downside_risk?: number | null
          id?: string
          invalidation_triggers?: string[] | null
          opportunity_type?: string
          organization_id?: string
          source?: string | null
          status?: string | null
          thesis?: string | null
          title?: string
          updated_at?: string
          upside_potential?: number | null
          why_not?: string | null
          why_now?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_pipeline_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      permission_contracts: {
        Row: {
          auto_execute_below: number | null
          created_at: string
          id: string
          monthly_cap_ads: number | null
          monthly_cap_experiments: number | null
          monthly_cap_tool_actions: number | null
          organization_id: string
          require_approval_above: number | null
          risk_posture_business: string | null
          risk_posture_marketing: string | null
          risk_posture_personal: string | null
          runway_minimum: number | null
          updated_at: string
          version: number | null
        }
        Insert: {
          auto_execute_below?: number | null
          created_at?: string
          id?: string
          monthly_cap_ads?: number | null
          monthly_cap_experiments?: number | null
          monthly_cap_tool_actions?: number | null
          organization_id: string
          require_approval_above?: number | null
          risk_posture_business?: string | null
          risk_posture_marketing?: string | null
          risk_posture_personal?: string | null
          runway_minimum?: number | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          auto_execute_below?: number | null
          created_at?: string
          id?: string
          monthly_cap_ads?: number | null
          monthly_cap_experiments?: number | null
          monthly_cap_tool_actions?: number | null
          organization_id?: string
          require_approval_above?: number | null
          risk_posture_business?: string | null
          risk_posture_marketing?: string | null
          risk_posture_personal?: string | null
          runway_minimum?: number | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
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
  public: {
    Enums: {},
  },
} as const
