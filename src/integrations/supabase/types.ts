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
      agent_execution_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          error_message: string | null
          executed_at: string | null
          id: string
          organization_id: string
          reasoning: string | null
          result: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          organization_id: string
          reasoning?: string | null
          result?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          organization_id?: string
          reasoning?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_execution_logs_organization_id_fkey"
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
      agent_states: {
        Row: {
          agent_name: string
          agent_type: string
          created_at: string | null
          current_task: string | null
          id: string
          last_action: string | null
          last_action_at: string | null
          metrics: Json | null
          organization_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_name: string
          agent_type: string
          created_at?: string | null
          current_task?: string | null
          id?: string
          last_action?: string | null
          last_action_at?: string | null
          metrics?: Json | null
          organization_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_name?: string
          agent_type?: string
          created_at?: string | null
          current_task?: string | null
          id?: string
          last_action?: string | null
          last_action_at?: string | null
          metrics?: Json | null
          organization_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_states_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          approved_by: string | null
          created_at: string | null
          description: string | null
          id: string
          organization_id: string
          request_type: string
          requested_by: string | null
          resolved_at: string | null
          status: string | null
          title: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id: string
          request_type: string
          requested_by?: string | null
          resolved_at?: string | null
          status?: string | null
          title: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          request_type?: string
          requested_by?: string | null
          resolved_at?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_organization_id_fkey"
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
      constraint_hierarchy: {
        Row: {
          constraint_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          priority: number | null
        }
        Insert: {
          constraint_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          priority?: number | null
        }
        Update: {
          constraint_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "constraint_hierarchy_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_priorities: {
        Row: {
          created_at: string | null
          date: string | null
          emerging_risks: Json | null
          focus_items: Json | null
          highest_roi_action: string | null
          id: string
          ignore_items: Json | null
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          emerging_risks?: Json | null
          focus_items?: Json | null
          highest_roi_action?: string | null
          id?: string
          ignore_items?: Json | null
          organization_id: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          emerging_risks?: Json | null
          focus_items?: Json | null
          highest_roi_action?: string | null
          id?: string
          ignore_items?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_priorities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_outcomes: {
        Row: {
          created_at: string | null
          decision_id: string | null
          id: string
          impact_score: number | null
          notes: string | null
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          decision_id?: string | null
          id?: string
          impact_score?: number | null
          notes?: string | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          decision_id?: string | null
          id?: string
          impact_score?: number | null
          notes?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_outcomes_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_outcomes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          created_at: string | null
          decision_data: Json | null
          id: string
          organization_id: string | null
          recommendation: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          decision_data?: Json | null
          id?: string
          organization_id?: string | null
          recommendation?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          decision_data?: Json | null
          id?: string
          organization_id?: string | null
          recommendation?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_tasks: {
        Row: {
          agent_type: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          max_retries: number | null
          organization_id: string
          output_data: Json | null
          priority: number | null
          retry_count: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          task_type: string
          workflow_id: string | null
        }
        Insert: {
          agent_type: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          max_retries?: number | null
          organization_id: string
          output_data?: Json | null
          priority?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          task_type: string
          workflow_id?: string | null
        }
        Update: {
          agent_type?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          max_retries?: number | null
          organization_id?: string
          output_data?: Json | null
          priority?: number | null
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          task_type?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
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
      founder_state_logs: {
        Row: {
          confidence_level: number | null
          decision_clarity: number | null
          energy_level: number | null
          id: string
          logged_at: string | null
          notes: string | null
          organization_id: string
        }
        Insert: {
          confidence_level?: number | null
          decision_clarity?: number | null
          energy_level?: number | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          organization_id: string
        }
        Update: {
          confidence_level?: number | null
          decision_clarity?: number | null
          energy_level?: number | null
          id?: string
          logged_at?: string | null
          notes?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "founder_state_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string | null
          organization_id: string
          phone: string | null
          score: number | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          organization_id: string
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          organization_id?: string
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      revenue_events: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          event_type: string | null
          id: string
          lead_id: string | null
          organization_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          event_type?: string | null
          id?: string
          lead_id?: string | null
          organization_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          event_type?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      taste_preferences: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          observation_count: number | null
          organization_id: string
          pattern_key: string
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          observation_count?: number | null
          organization_id: string
          pattern_key: string
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          observation_count?: number | null
          organization_id?: string
          pattern_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taste_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
      app_role: "admin" | "moderator" | "user" | "operator"
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
      app_role: ["admin", "moderator", "user", "operator"],
    },
  },
} as const
