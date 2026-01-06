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
      actions: {
        Row: {
          action_type: string
          approved_by: string | null
          created_at: string
          decision_id: string | null
          executed_at: string | null
          id: string
          organization_id: string
          parameters: Json | null
          result: Json | null
          rollback_data: Json | null
          status: string
          tool: string
        }
        Insert: {
          action_type: string
          approved_by?: string | null
          created_at?: string
          decision_id?: string | null
          executed_at?: string | null
          id?: string
          organization_id: string
          parameters?: Json | null
          result?: Json | null
          rollback_data?: Json | null
          status?: string
          tool: string
        }
        Update: {
          action_type?: string
          approved_by?: string | null
          created_at?: string
          decision_id?: string | null
          executed_at?: string | null
          id?: string
          organization_id?: string
          parameters?: Json | null
          result?: Json | null
          rollback_data?: Json | null
          status?: string
          tool?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_type: string
          body: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          opportunity_id: string | null
          organization_id: string
          subject: string | null
        }
        Insert: {
          activity_type: string
          body?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          opportunity_id?: string | null
          organization_id: string
          subject?: string | null
        }
        Update: {
          activity_type?: string
          body?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          opportunity_id?: string | null
          organization_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_accounts: {
        Row: {
          created_at: string | null
          credentials_encrypted: string | null
          currency: string | null
          external_account_id: string
          id: string
          last_synced_at: string | null
          name: string | null
          organization_id: string
          platform: string | null
          status: string | null
          timezone: string | null
        }
        Insert: {
          created_at?: string | null
          credentials_encrypted?: string | null
          currency?: string | null
          external_account_id: string
          id?: string
          last_synced_at?: string | null
          name?: string | null
          organization_id: string
          platform?: string | null
          status?: string | null
          timezone?: string | null
        }
        Update: {
          created_at?: string | null
          credentials_encrypted?: string | null
          currency?: string | null
          external_account_id?: string
          id?: string
          last_synced_at?: string | null
          name?: string | null
          organization_id?: string
          platform?: string | null
          status?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_insights: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          leads: number | null
          organization_id: string
          reach: number | null
          roas: number | null
          spend: number | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          leads?: number | null
          organization_id: string
          reach?: number | null
          roas?: number | null
          spend?: number | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          organization_id?: string
          reach?: number | null
          roas?: number | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_insights_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "meta_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_insights_organization_id_fkey"
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
          executed_at: string
          id: string
          lead_id: string | null
          organization_id: string
          reasoning: string | null
          result: string | null
          workflow_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          error_message?: string | null
          executed_at?: string
          id?: string
          lead_id?: string | null
          organization_id: string
          reasoning?: string | null
          result?: string | null
          workflow_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          lead_id?: string | null
          organization_id?: string
          reasoning?: string | null
          result?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_execution_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_execution_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_execution_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_objectives: {
        Row: {
          agent_id: string
          agent_type: string
          constraints: string[] | null
          cost_function: string | null
          created_at: string | null
          id: string
          kill_threshold: number | null
          organization_id: string
          primary_metric: string
          regret_tracker_enabled: boolean | null
          reward_shaping: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          agent_type: string
          constraints?: string[] | null
          cost_function?: string | null
          created_at?: string | null
          id?: string
          kill_threshold?: number | null
          organization_id: string
          primary_metric: string
          regret_tracker_enabled?: boolean | null
          reward_shaping?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          agent_type?: string
          constraints?: string[] | null
          cost_function?: string | null
          created_at?: string | null
          id?: string
          kill_threshold?: number | null
          organization_id?: string
          primary_metric?: string
          regret_tracker_enabled?: boolean | null
          reward_shaping?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_objectives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_policies: {
        Row: {
          agent_id: string
          created_at: string | null
          deployed_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          policy_text: string
          trigger_event_id: string | null
          validation_results: Json | null
          version: number
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          deployed_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          policy_text: string
          trigger_event_id?: string | null
          validation_results?: Json | null
          version: number
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          deployed_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          policy_text?: string
          trigger_event_id?: string | null
          validation_results?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_policies_trigger_event_id_fkey"
            columns: ["trigger_event_id"]
            isOneToOne: false
            referencedRelation: "learning_events"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_states: {
        Row: {
          agent_name: string
          agent_type: string
          config: Json | null
          created_at: string
          current_task: string | null
          id: string
          last_action: string | null
          last_action_at: string | null
          metrics: Json | null
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_name: string
          agent_type: string
          config?: Json | null
          created_at?: string
          current_task?: string | null
          id?: string
          last_action?: string | null
          last_action_at?: string | null
          metrics?: Json | null
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          agent_type?: string
          config?: Json | null
          created_at?: string
          current_task?: string | null
          id?: string
          last_action?: string | null
          last_action_at?: string | null
          metrics?: Json | null
          organization_id?: string
          status?: string
          updated_at?: string
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
      agent_trust_scores: {
        Row: {
          agent_id: string
          current_level: number | null
          failure_count: number | null
          id: string
          last_evaluation: string | null
          max_allowed_level: number | null
          organization_id: string
          regret_sum: number | null
          success_count: number | null
        }
        Insert: {
          agent_id: string
          current_level?: number | null
          failure_count?: number | null
          id?: string
          last_evaluation?: string | null
          max_allowed_level?: number | null
          organization_id: string
          regret_sum?: number | null
          success_count?: number | null
        }
        Update: {
          agent_id?: string
          current_level?: number | null
          failure_count?: number | null
          id?: string
          last_evaluation?: string | null
          max_allowed_level?: number | null
          organization_id?: string
          regret_sum?: number | null
          success_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_trust_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          priority: number | null
          rule_action: string
          rule_condition: Json | null
          rule_name: string
          rule_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          priority?: number | null
          rule_action: string
          rule_condition?: Json | null
          rule_name: string
          rule_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          priority?: number | null
          rule_action?: string
          rule_condition?: Json | null
          rule_name?: string
          rule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      allocation_decisions: {
        Row: {
          ai_reasoning: string | null
          ai_recommendation: string | null
          category: string
          created_at: string
          current_allocation_state: Json | null
          decided_at: string | null
          decided_by: string | null
          decision: string | null
          decision_type: string
          id: string
          organization_id: string
          projected_impact: Json | null
          request_description: string
          requested_amount: number | null
          resource_type: string
        }
        Insert: {
          ai_reasoning?: string | null
          ai_recommendation?: string | null
          category: string
          created_at?: string
          current_allocation_state?: Json | null
          decided_at?: string | null
          decided_by?: string | null
          decision?: string | null
          decision_type: string
          id?: string
          organization_id: string
          projected_impact?: Json | null
          request_description: string
          requested_amount?: number | null
          resource_type: string
        }
        Update: {
          ai_reasoning?: string | null
          ai_recommendation?: string | null
          category?: string
          created_at?: string
          current_allocation_state?: Json | null
          decided_at?: string | null
          decided_by?: string | null
          decision?: string | null
          decision_type?: string
          id?: string
          organization_id?: string
          projected_impact?: Json | null
          request_description?: string
          requested_amount?: number | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocation_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          agent_recommendation: string | null
          amount: number | null
          created_at: string
          currency: string | null
          decision: string | null
          decision_notes: string | null
          description: string | null
          id: string
          lead_id: string | null
          organization_id: string
          request_type: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_assessment: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_recommendation?: string | null
          amount?: number | null
          created_at?: string
          currency?: string | null
          decision?: string | null
          decision_notes?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          organization_id: string
          request_type?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_assessment?: Json | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_recommendation?: string | null
          amount?: number | null
          created_at?: string
          currency?: string | null
          decision?: string | null
          decision_notes?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          organization_id?: string
          request_type?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_assessment?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      arbitrage_opportunities: {
        Row: {
          action_required: string | null
          actioned_at: string | null
          captured_value: number | null
          confidence_score: number | null
          current_state: Json
          description: string
          detected_at: string
          estimated_uplift_amount: number | null
          estimated_uplift_percent: number | null
          evidence: Json
          id: string
          opportunity_type: string
          optimal_state: Json
          organization_id: string
          status: string
          title: string
        }
        Insert: {
          action_required?: string | null
          actioned_at?: string | null
          captured_value?: number | null
          confidence_score?: number | null
          current_state?: Json
          description: string
          detected_at?: string
          estimated_uplift_amount?: number | null
          estimated_uplift_percent?: number | null
          evidence?: Json
          id?: string
          opportunity_type: string
          optimal_state?: Json
          organization_id: string
          status?: string
          title: string
        }
        Update: {
          action_required?: string | null
          actioned_at?: string | null
          captured_value?: number | null
          confidence_score?: number | null
          current_state?: Json
          description?: string
          detected_at?: string
          estimated_uplift_amount?: number | null
          estimated_uplift_percent?: number | null
          evidence?: Json
          id?: string
          opportunity_type?: string
          optimal_state?: Json
          organization_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "arbitrage_opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      arbitrage_opportunities_queue: {
        Row: {
          automation_compatibility: number | null
          base_case: number | null
          best_case: number | null
          confidence_score: number | null
          description: string | null
          detected_at: string
          downside_risk: number | null
          estimated_cost: number | null
          estimated_revenue: number | null
          estimated_roi_percent: number | null
          executed_at: string | null
          execution_certainty: number | null
          expires_at: string | null
          id: string
          niche: string | null
          opportunity_type: string
          organization_id: string
          outcome: Json | null
          requires_capital: number | null
          simulation_results: Json | null
          source: string | null
          status: string
          time_to_execute_hours: number | null
          title: string
          worst_case: number | null
        }
        Insert: {
          automation_compatibility?: number | null
          base_case?: number | null
          best_case?: number | null
          confidence_score?: number | null
          description?: string | null
          detected_at?: string
          downside_risk?: number | null
          estimated_cost?: number | null
          estimated_revenue?: number | null
          estimated_roi_percent?: number | null
          executed_at?: string | null
          execution_certainty?: number | null
          expires_at?: string | null
          id?: string
          niche?: string | null
          opportunity_type: string
          organization_id: string
          outcome?: Json | null
          requires_capital?: number | null
          simulation_results?: Json | null
          source?: string | null
          status?: string
          time_to_execute_hours?: number | null
          title: string
          worst_case?: number | null
        }
        Update: {
          automation_compatibility?: number | null
          base_case?: number | null
          best_case?: number | null
          confidence_score?: number | null
          description?: string | null
          detected_at?: string
          downside_risk?: number | null
          estimated_cost?: number | null
          estimated_revenue?: number | null
          estimated_roi_percent?: number | null
          executed_at?: string | null
          execution_certainty?: number | null
          expires_at?: string | null
          id?: string
          niche?: string | null
          opportunity_type?: string
          organization_id?: string
          outcome?: Json | null
          requires_capital?: number | null
          simulation_results?: Json | null
          source?: string | null
          status?: string
          time_to_execute_hours?: number | null
          title?: string
          worst_case?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "arbitrage_opportunities_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          organization_id: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          organization_id: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          organization_id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      authority_emails: {
        Row: {
          closing_loop: string | null
          confidence_score: number | null
          contact_id: string | null
          created_at: string
          diagnosis_id: string
          email_body: string
          id: string
          opened_at: string | null
          organization_id: string
          personalization_hooks: string[] | null
          replied_at: string | null
          sent_at: string | null
          status: string
          subject_line: string
          variant_id: string | null
          variant_tag: string | null
        }
        Insert: {
          closing_loop?: string | null
          confidence_score?: number | null
          contact_id?: string | null
          created_at?: string
          diagnosis_id: string
          email_body: string
          id?: string
          opened_at?: string | null
          organization_id: string
          personalization_hooks?: string[] | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
          subject_line: string
          variant_id?: string | null
          variant_tag?: string | null
        }
        Update: {
          closing_loop?: string | null
          confidence_score?: number | null
          contact_id?: string | null
          created_at?: string
          diagnosis_id?: string
          email_body?: string
          id?: string
          opened_at?: string | null
          organization_id?: string
          personalization_hooks?: string[] | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
          subject_line?: string
          variant_id?: string | null
          variant_tag?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authority_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authority_emails_diagnosis_id_fkey"
            columns: ["diagnosis_id"]
            isOneToOne: false
            referencedRelation: "website_diagnoses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authority_emails_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authority_emails_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "prompt_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_declined_activities: {
        Row: {
          activity_description: string
          activity_type: string
          alternative_suggested: string | null
          auto_declined: boolean | null
          declined_at: string
          estimated_opportunity_cost: number
          id: string
          organization_id: string
          reason_declined: string
          user_override: boolean | null
        }
        Insert: {
          activity_description: string
          activity_type: string
          alternative_suggested?: string | null
          auto_declined?: boolean | null
          declined_at?: string
          estimated_opportunity_cost: number
          id?: string
          organization_id: string
          reason_declined: string
          user_override?: boolean | null
        }
        Update: {
          activity_description?: string
          activity_type?: string
          alternative_suggested?: string | null
          auto_declined?: boolean | null
          declined_at?: string
          estimated_opportunity_cost?: number
          id?: string
          organization_id?: string
          reason_declined?: string
          user_override?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_declined_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_products: {
        Row: {
          actual_price: number | null
          created_at: string
          delivery_mechanism: string | null
          id: string
          launched_at: string | null
          organization_id: string
          platform_fee_percent: number | null
          pricing_model: string | null
          product_description: string | null
          product_name: string
          product_type: string
          sales_page_content: Json | null
          source_pattern_id: string | null
          status: string
          suggested_price: number | null
          total_revenue: number | null
          total_sales: number | null
        }
        Insert: {
          actual_price?: number | null
          created_at?: string
          delivery_mechanism?: string | null
          id?: string
          launched_at?: string | null
          organization_id: string
          platform_fee_percent?: number | null
          pricing_model?: string | null
          product_description?: string | null
          product_name: string
          product_type: string
          sales_page_content?: Json | null
          source_pattern_id?: string | null
          status?: string
          suggested_price?: number | null
          total_revenue?: number | null
          total_sales?: number | null
        }
        Update: {
          actual_price?: number | null
          created_at?: string
          delivery_mechanism?: string | null
          id?: string
          launched_at?: string | null
          organization_id?: string
          platform_fee_percent?: number | null
          pricing_model?: string | null
          product_description?: string | null
          product_name?: string
          product_type?: string
          sales_page_content?: Json | null
          source_pattern_id?: string | null
          status?: string
          suggested_price?: number | null
          total_revenue?: number | null
          total_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_products_source_pattern_id_fkey"
            columns: ["source_pattern_id"]
            isOneToOne: false
            referencedRelation: "success_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_tag_rules: {
        Row: {
          conditions: Json
          created_at: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          priority: number | null
          tag_id: string
          updated_at: string | null
        }
        Insert: {
          conditions?: Json
          created_at?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          priority?: number | null
          tag_id: string
          updated_at?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          priority?: number | null
          tag_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_tag_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_tag_rules_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_workflows: {
        Row: {
          actions: Json | null
          created_at: string
          cron_expression: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          next_run_at: string | null
          organization_id: string
          stage: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          created_at?: string
          cron_expression?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          next_run_at?: string | null
          organization_id: string
          stage: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          created_at?: string
          cron_expression?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          next_run_at?: string | null
          organization_id?: string
          stage?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      autonomous_actions: {
        Row: {
          action_type: string
          agent_type: string
          approved_at: string | null
          approved_by: string | null
          confidence_score: number | null
          created_at: string
          decision: string
          executed_at: string | null
          execution_result: Json | null
          id: string
          organization_id: string
          reasoning: string | null
          requires_approval: boolean | null
          target_entity_id: string | null
          target_entity_type: string | null
          value_impact: number | null
          was_auto_executed: boolean | null
        }
        Insert: {
          action_type: string
          agent_type: string
          approved_at?: string | null
          approved_by?: string | null
          confidence_score?: number | null
          created_at?: string
          decision: string
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          organization_id: string
          reasoning?: string | null
          requires_approval?: boolean | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          value_impact?: number | null
          was_auto_executed?: boolean | null
        }
        Update: {
          action_type?: string
          agent_type?: string
          approved_at?: string | null
          approved_by?: string | null
          confidence_score?: number | null
          created_at?: string
          decision?: string
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          organization_id?: string
          reasoning?: string | null
          requires_approval?: boolean | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          value_impact?: number | null
          was_auto_executed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      autonomous_agent_config: {
        Row: {
          agent_type: string
          auto_execute_threshold: number | null
          config: Json | null
          created_at: string
          enabled: boolean | null
          id: string
          last_run: string | null
          max_daily_actions: number | null
          organization_id: string
          requires_approval_above: number | null
          risk_tolerance: string | null
          total_actions_taken: number | null
          total_value_generated: number | null
          updated_at: string
        }
        Insert: {
          agent_type: string
          auto_execute_threshold?: number | null
          config?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          last_run?: string | null
          max_daily_actions?: number | null
          organization_id: string
          requires_approval_above?: number | null
          risk_tolerance?: string | null
          total_actions_taken?: number | null
          total_value_generated?: number | null
          updated_at?: string
        }
        Update: {
          agent_type?: string
          auto_execute_threshold?: number | null
          config?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          last_run?: string | null
          max_daily_actions?: number | null
          organization_id?: string
          requires_approval_above?: number | null
          risk_tolerance?: string | null
          total_actions_taken?: number | null
          total_value_generated?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_agent_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          organization_id: string
          start_time: string
          timezone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          start_time: string
          timezone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          start_time?: string
          timezone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_access: {
        Row: {
          access_level: string
          api_access_enabled: boolean | null
          categories_accessible: string[] | null
          created_at: string
          data_export_enabled: boolean | null
          id: string
          monthly_fee: number | null
          organization_id: string
        }
        Insert: {
          access_level?: string
          api_access_enabled?: boolean | null
          categories_accessible?: string[] | null
          created_at?: string
          data_export_enabled?: boolean | null
          id?: string
          monthly_fee?: number | null
          organization_id: string
        }
        Update: {
          access_level?: string
          api_access_enabled?: boolean | null
          categories_accessible?: string[] | null
          created_at?: string
          data_export_enabled?: boolean | null
          id?: string
          monthly_fee?: number | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_categories: {
        Row: {
          category_name: string
          created_at: string
          data_points_required: number | null
          description: string | null
          id: string
          is_premium: boolean | null
          update_frequency: string | null
        }
        Insert: {
          category_name: string
          created_at?: string
          data_points_required?: number | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          update_frequency?: string | null
        }
        Update: {
          category_name?: string
          created_at?: string
          data_points_required?: number | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          update_frequency?: string | null
        }
        Relationships: []
      }
      benchmark_data_points: {
        Row: {
          category_id: string
          company_size: string | null
          id: string
          industry: string | null
          metric_name: string
          metric_value: number
          organization_id: string | null
          recorded_at: string
        }
        Insert: {
          category_id: string
          company_size?: string | null
          id?: string
          industry?: string | null
          metric_name: string
          metric_value: number
          organization_id?: string | null
          recorded_at?: string
        }
        Update: {
          category_id?: string
          company_size?: string | null
          id?: string
          industry?: string | null
          metric_name?: string
          metric_value?: number
          organization_id?: string | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_data_points_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "benchmark_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmark_data_points_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_indexes: {
        Row: {
          calculated_at: string
          calculation_method: string
          category_id: string
          change_percent: number | null
          confidence_level: number | null
          current_value: number
          id: string
          index_name: string
          previous_value: number | null
          sample_size: number
        }
        Insert: {
          calculated_at?: string
          calculation_method: string
          category_id: string
          change_percent?: number | null
          confidence_level?: number | null
          current_value: number
          id?: string
          index_name: string
          previous_value?: number | null
          sample_size: number
        }
        Update: {
          calculated_at?: string
          calculation_method?: string
          category_id?: string
          change_percent?: number | null
          confidence_level?: number | null
          current_value?: number
          id?: string
          index_name?: string
          previous_value?: number | null
          sample_size?: number
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_indexes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "benchmark_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          organization_id: string
          period_end: string | null
          period_start: string | null
          status: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      boardroom_sessions: {
        Row: {
          ceo_response: Json | null
          cfo_response: Json | null
          cmo_response: Json | null
          confidence_score: number | null
          context: Json | null
          created_at: string | null
          cro_response: Json | null
          id: string
          organization_id: string
          question: string
          recommended_action: string | null
          status: string | null
          synthesis: string | null
        }
        Insert: {
          ceo_response?: Json | null
          cfo_response?: Json | null
          cmo_response?: Json | null
          confidence_score?: number | null
          context?: Json | null
          created_at?: string | null
          cro_response?: Json | null
          id?: string
          organization_id: string
          question: string
          recommended_action?: string | null
          status?: string | null
          synthesis?: string | null
        }
        Update: {
          ceo_response?: Json | null
          cfo_response?: Json | null
          cmo_response?: Json | null
          confidence_score?: number | null
          context?: Json | null
          created_at?: string | null
          cro_response?: Json | null
          id?: string
          organization_id?: string
          question?: string
          recommended_action?: string | null
          status?: string | null
          synthesis?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boardroom_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_types: {
        Row: {
          buffer_after_minutes: number | null
          buffer_before_minutes: number | null
          color: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          price: number | null
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          price?: number | null
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          price?: number | null
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_type_id: string | null
          contact_id: string | null
          created_at: string | null
          deposit_required: boolean | null
          end_time: string
          google_event_id: string | null
          host_id: string | null
          id: string
          metadata: Json | null
          no_show_count: number | null
          notes: string | null
          organization_id: string
          reminder_sent: boolean | null
          start_time: string
          status: string | null
          title: string | null
          updated_at: string | null
          zoom_link: string | null
        }
        Insert: {
          booking_type_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          deposit_required?: boolean | null
          end_time: string
          google_event_id?: string | null
          host_id?: string | null
          id?: string
          metadata?: Json | null
          no_show_count?: number | null
          notes?: string | null
          organization_id: string
          reminder_sent?: boolean | null
          start_time: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          zoom_link?: string | null
        }
        Update: {
          booking_type_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          deposit_required?: boolean | null
          end_time?: string
          google_event_id?: string | null
          host_id?: string | null
          id?: string
          metadata?: Json | null
          no_show_count?: number | null
          notes?: string | null
          organization_id?: string
          reminder_sent?: boolean | null
          start_time?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          zoom_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_booking_type_id_fkey"
            columns: ["booking_type_id"]
            isOneToOne: false
            referencedRelation: "booking_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organization_id_fkey"
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
      business_digital_twin: {
        Row: {
          burn_metrics: Json
          capacity_metrics: Json
          created_at: string
          demand_metrics: Json
          health_score: number | null
          id: string
          organization_id: string
          pricing_metrics: Json
          revenue_streams: Json
          risk_factors: Json
          snapshot_date: string
        }
        Insert: {
          burn_metrics?: Json
          capacity_metrics?: Json
          created_at?: string
          demand_metrics?: Json
          health_score?: number | null
          id?: string
          organization_id: string
          pricing_metrics?: Json
          revenue_streams?: Json
          risk_factors?: Json
          snapshot_date?: string
        }
        Update: {
          burn_metrics?: Json
          capacity_metrics?: Json
          created_at?: string
          demand_metrics?: Json
          health_score?: number | null
          id?: string
          organization_id?: string
          pricing_metrics?: Json
          revenue_streams?: Json
          risk_factors?: Json
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_digital_twin_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_identity: {
        Row: {
          created_at: string
          description: string | null
          id: string
          identity_element: string
          organization_id: string
          priority: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          identity_element: string
          organization_id: string
          priority?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          identity_element?: string
          organization_id?: string
          priority?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_identity_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          ai_agent_name: string | null
          ai_agent_positioning: string | null
          ai_agent_role: string | null
          avatar_anti_desires: string[] | null
          avatar_description: string | null
          avatar_desires: string[] | null
          avatar_income_ceiling: number | null
          avatar_income_floor: number | null
          avatar_name: string | null
          avatar_pain_points: string[] | null
          brand_voice_adjectives: string[] | null
          brand_voice_avoid: string[] | null
          business_model: string | null
          business_name: string
          content_style: string | null
          created_at: string | null
          discount_policy: string | null
          flagship_offer_deliverables: string[] | null
          flagship_offer_description: string | null
          flagship_offer_duration: string | null
          flagship_offer_name: string | null
          flagship_offer_price: number | null
          founder_expertise: string[] | null
          founder_name: string | null
          founder_title: string | null
          id: string
          industry: string | null
          methodology_name: string | null
          methodology_stages: Json | null
          non_negotiables: string[] | null
          objection_handling: string | null
          organization_id: string
          price_anchor: number | null
          price_ceiling: number | null
          price_floor: number | null
          pricing_philosophy: string | null
          primary_kpi: string | null
          quality_standards: string[] | null
          sales_style: string | null
          secondary_kpis: string[] | null
          tagline: string | null
          updated_at: string | null
          years_in_industry: number | null
        }
        Insert: {
          ai_agent_name?: string | null
          ai_agent_positioning?: string | null
          ai_agent_role?: string | null
          avatar_anti_desires?: string[] | null
          avatar_description?: string | null
          avatar_desires?: string[] | null
          avatar_income_ceiling?: number | null
          avatar_income_floor?: number | null
          avatar_name?: string | null
          avatar_pain_points?: string[] | null
          brand_voice_adjectives?: string[] | null
          brand_voice_avoid?: string[] | null
          business_model?: string | null
          business_name?: string
          content_style?: string | null
          created_at?: string | null
          discount_policy?: string | null
          flagship_offer_deliverables?: string[] | null
          flagship_offer_description?: string | null
          flagship_offer_duration?: string | null
          flagship_offer_name?: string | null
          flagship_offer_price?: number | null
          founder_expertise?: string[] | null
          founder_name?: string | null
          founder_title?: string | null
          id?: string
          industry?: string | null
          methodology_name?: string | null
          methodology_stages?: Json | null
          non_negotiables?: string[] | null
          objection_handling?: string | null
          organization_id: string
          price_anchor?: number | null
          price_ceiling?: number | null
          price_floor?: number | null
          pricing_philosophy?: string | null
          primary_kpi?: string | null
          quality_standards?: string[] | null
          sales_style?: string | null
          secondary_kpis?: string[] | null
          tagline?: string | null
          updated_at?: string | null
          years_in_industry?: number | null
        }
        Update: {
          ai_agent_name?: string | null
          ai_agent_positioning?: string | null
          ai_agent_role?: string | null
          avatar_anti_desires?: string[] | null
          avatar_description?: string | null
          avatar_desires?: string[] | null
          avatar_income_ceiling?: number | null
          avatar_income_floor?: number | null
          avatar_name?: string | null
          avatar_pain_points?: string[] | null
          brand_voice_adjectives?: string[] | null
          brand_voice_avoid?: string[] | null
          business_model?: string | null
          business_name?: string
          content_style?: string | null
          created_at?: string | null
          discount_policy?: string | null
          flagship_offer_deliverables?: string[] | null
          flagship_offer_description?: string | null
          flagship_offer_duration?: string | null
          flagship_offer_name?: string | null
          flagship_offer_price?: number | null
          founder_expertise?: string[] | null
          founder_name?: string | null
          founder_title?: string | null
          id?: string
          industry?: string | null
          methodology_name?: string | null
          methodology_stages?: Json | null
          non_negotiables?: string[] | null
          objection_handling?: string | null
          organization_id?: string
          price_anchor?: number | null
          price_ceiling?: number | null
          price_floor?: number | null
          pricing_philosophy?: string | null
          primary_kpi?: string | null
          quality_standards?: string[] | null
          sales_style?: string | null
          secondary_kpis?: string[] | null
          tagline?: string | null
          updated_at?: string | null
          years_in_industry?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_threats: {
        Row: {
          auto_blocked: boolean | null
          block_reason: string | null
          description: string
          detected_at: string
          id: string
          organization_id: string
          override_reason: string | null
          potential_damage: number | null
          resolution_outcome: string | null
          resolved_at: string | null
          severity: string | null
          source: string | null
          threat_type: string
          user_override: boolean | null
        }
        Insert: {
          auto_blocked?: boolean | null
          block_reason?: string | null
          description: string
          detected_at?: string
          id?: string
          organization_id: string
          override_reason?: string | null
          potential_damage?: number | null
          resolution_outcome?: string | null
          resolved_at?: string | null
          severity?: string | null
          source?: string | null
          threat_type: string
          user_override?: boolean | null
        }
        Update: {
          auto_blocked?: boolean | null
          block_reason?: string | null
          description?: string
          detected_at?: string
          id?: string
          organization_id?: string
          override_reason?: string | null
          potential_damage?: number | null
          resolution_outcome?: string | null
          resolved_at?: string | null
          severity?: string | null
          source?: string | null
          threat_type?: string
          user_override?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "business_threats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_psychology: {
        Row: {
          awareness_stage: string | null
          buying_momentum: number | null
          confidence_score: number | null
          contact_id: string | null
          created_at: string | null
          did_not_buy_details: Json | null
          did_not_buy_reason: string | null
          friction_score: number | null
          id: string
          last_negative_interaction: string | null
          last_positive_interaction: string | null
          lead_id: string | null
          momentum_direction: string | null
          objections_raised: string[] | null
          objections_resolved: string[] | null
          organization_id: string
          primary_objection: string | null
          stage_entered_at: string | null
          trust_events: Json | null
          trust_score: number | null
          updated_at: string | null
          urgency_score: number | null
        }
        Insert: {
          awareness_stage?: string | null
          buying_momentum?: number | null
          confidence_score?: number | null
          contact_id?: string | null
          created_at?: string | null
          did_not_buy_details?: Json | null
          did_not_buy_reason?: string | null
          friction_score?: number | null
          id?: string
          last_negative_interaction?: string | null
          last_positive_interaction?: string | null
          lead_id?: string | null
          momentum_direction?: string | null
          objections_raised?: string[] | null
          objections_resolved?: string[] | null
          organization_id: string
          primary_objection?: string | null
          stage_entered_at?: string | null
          trust_events?: Json | null
          trust_score?: number | null
          updated_at?: string | null
          urgency_score?: number | null
        }
        Update: {
          awareness_stage?: string | null
          buying_momentum?: number | null
          confidence_score?: number | null
          contact_id?: string | null
          created_at?: string | null
          did_not_buy_details?: Json | null
          did_not_buy_reason?: string | null
          friction_score?: number | null
          id?: string
          last_negative_interaction?: string | null
          last_positive_interaction?: string | null
          lead_id?: string | null
          momentum_direction?: string | null
          objections_raised?: string[] | null
          objections_resolved?: string[] | null
          organization_id?: string
          primary_objection?: string | null
          stage_entered_at?: string | null
          trust_events?: Json | null
          trust_score?: number | null
          updated_at?: string | null
          urgency_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_psychology_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_psychology_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_psychology_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events_sync: {
        Row: {
          attendees_count: number | null
          cancelled: boolean | null
          duration_minutes: number | null
          end_time: string
          event_type: string | null
          external_id: string
          id: string
          is_revenue_generating: boolean | null
          no_show: boolean | null
          organization_id: string
          recurring: boolean | null
          source: string
          start_time: string
          synced_at: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          attendees_count?: number | null
          cancelled?: boolean | null
          duration_minutes?: number | null
          end_time: string
          event_type?: string | null
          external_id: string
          id?: string
          is_revenue_generating?: boolean | null
          no_show?: boolean | null
          organization_id: string
          recurring?: boolean | null
          source: string
          start_time: string
          synced_at?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          attendees_count?: number | null
          cancelled?: boolean | null
          duration_minutes?: number | null
          end_time?: string
          event_type?: string | null
          external_id?: string
          id?: string
          is_revenue_generating?: boolean | null
          no_show?: boolean | null
          organization_id?: string
          recurring?: boolean | null
          source?: string
          start_time?: string
          synced_at?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_sync_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_analysis: {
        Row: {
          ai_recommendations: Json | null
          buyer_signals: string[] | null
          competitor_mentions: string[] | null
          created_at: string
          deal_accelerators: string[] | null
          deal_killers: string[] | null
          emotional_moments: Json | null
          id: string
          key_quotes: Json | null
          next_steps_mentioned: string[] | null
          objections_detected: string[] | null
          organization_id: string
          pricing_discussions: Json | null
          sentiment_timeline: Json | null
          talk_ratio: Json | null
          transcript_id: string
          win_probability_change: number | null
        }
        Insert: {
          ai_recommendations?: Json | null
          buyer_signals?: string[] | null
          competitor_mentions?: string[] | null
          created_at?: string
          deal_accelerators?: string[] | null
          deal_killers?: string[] | null
          emotional_moments?: Json | null
          id?: string
          key_quotes?: Json | null
          next_steps_mentioned?: string[] | null
          objections_detected?: string[] | null
          organization_id: string
          pricing_discussions?: Json | null
          sentiment_timeline?: Json | null
          talk_ratio?: Json | null
          transcript_id: string
          win_probability_change?: number | null
        }
        Update: {
          ai_recommendations?: Json | null
          buyer_signals?: string[] | null
          competitor_mentions?: string[] | null
          created_at?: string
          deal_accelerators?: string[] | null
          deal_killers?: string[] | null
          emotional_moments?: Json | null
          id?: string
          key_quotes?: Json | null
          next_steps_mentioned?: string[] | null
          objections_detected?: string[] | null
          organization_id?: string
          pricing_discussions?: Json | null
          sentiment_timeline?: Json | null
          talk_ratio?: Json | null
          transcript_id?: string
          win_probability_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "call_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_analysis_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "call_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      call_intelligence: {
        Row: {
          buying_intent_signals: string[] | null
          call_date: string | null
          call_duration: number | null
          call_id: string | null
          close_probability: number | null
          contact_id: string | null
          created_at: string | null
          decision_criteria: string[] | null
          follow_up_email_draft: string | null
          follow_up_urgency: string | null
          id: string
          next_step_commitments: string[] | null
          objections: Json | null
          opportunity_id: string | null
          organization_id: string
          recommended_actions: Json | null
          stakeholders_mentioned: string[] | null
          transcript_text: string | null
        }
        Insert: {
          buying_intent_signals?: string[] | null
          call_date?: string | null
          call_duration?: number | null
          call_id?: string | null
          close_probability?: number | null
          contact_id?: string | null
          created_at?: string | null
          decision_criteria?: string[] | null
          follow_up_email_draft?: string | null
          follow_up_urgency?: string | null
          id?: string
          next_step_commitments?: string[] | null
          objections?: Json | null
          opportunity_id?: string | null
          organization_id: string
          recommended_actions?: Json | null
          stakeholders_mentioned?: string[] | null
          transcript_text?: string | null
        }
        Update: {
          buying_intent_signals?: string[] | null
          call_date?: string | null
          call_duration?: number | null
          call_id?: string | null
          close_probability?: number | null
          contact_id?: string | null
          created_at?: string | null
          decision_criteria?: string[] | null
          follow_up_email_draft?: string | null
          follow_up_urgency?: string | null
          id?: string
          next_step_commitments?: string[] | null
          objections?: Json | null
          opportunity_id?: string | null
          organization_id?: string
          recommended_actions?: Json | null
          stakeholders_mentioned?: string[] | null
          transcript_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_intelligence_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_intelligence_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_intelligence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      call_transcripts: {
        Row: {
          duration_minutes: number | null
          ended_at: string | null
          external_id: string | null
          id: string
          lead_id: string | null
          meeting_title: string | null
          meeting_type: string | null
          organization_id: string
          participants: string[] | null
          source: string
          started_at: string
          synced_at: string
          transcript_segments: Json | null
          transcript_text: string | null
        }
        Insert: {
          duration_minutes?: number | null
          ended_at?: string | null
          external_id?: string | null
          id?: string
          lead_id?: string | null
          meeting_title?: string | null
          meeting_type?: string | null
          organization_id: string
          participants?: string[] | null
          source: string
          started_at: string
          synced_at?: string
          transcript_segments?: Json | null
          transcript_text?: string | null
        }
        Update: {
          duration_minutes?: number | null
          ended_at?: string | null
          external_id?: string | null
          id?: string
          lead_id?: string | null
          meeting_title?: string | null
          meeting_type?: string | null
          organization_id?: string
          participants?: string[] | null
          source?: string
          started_at?: string
          synced_at?: string
          transcript_segments?: Json | null
          transcript_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_transcripts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_transcripts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_enrollments: {
        Row: {
          campaign_id: string
          completed_at: string | null
          contact_id: string
          current_step: number | null
          enrolled_at: string | null
          id: string
          metadata: Json | null
          next_step_at: string | null
          status: string | null
          stop_reason: string | null
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          contact_id: string
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          metadata?: Json | null
          next_step_at?: string | null
          status?: string | null
          stop_reason?: string | null
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          contact_id?: string
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          metadata?: Json | null
          next_step_at?: string | null
          status?: string | null
          stop_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_events: {
        Row: {
          enrollment_id: string
          event_type: string
          id: string
          metadata: Json | null
          occurred_at: string | null
          step_id: string | null
        }
        Insert: {
          enrollment_id: string
          event_type: string
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          step_id?: string | null
        }
        Update: {
          enrollment_id?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string | null
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "campaign_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_events_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "campaign_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_steps: {
        Row: {
          body: string | null
          branch_conditions: Json | null
          campaign_id: string
          created_at: string | null
          delay_minutes: number | null
          id: string
          settings: Json | null
          step_number: number
          step_type: string
          subject: string | null
          template_id: string | null
        }
        Insert: {
          body?: string | null
          branch_conditions?: Json | null
          campaign_id: string
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          settings?: Json | null
          step_number: number
          step_type: string
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          body?: string | null
          branch_conditions?: Json | null
          campaign_id?: string
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          settings?: Json | null
          step_number?: number
          step_type?: string
          subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_type: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          settings: Json | null
          stats: Json | null
          status: string | null
          stop_conditions: Json | null
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          settings?: Json | null
          stats?: Json | null
          status?: string | null
          stop_conditions?: Json | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          settings?: Json | null
          stats?: Json | null
          status?: string | null
          stop_conditions?: Json | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_allocation_rules: {
        Row: {
          allocation_category: string
          created_at: string
          id: string
          is_active: boolean | null
          max_allocation_percent: number | null
          min_allocation_percent: number | null
          organization_id: string
          priority: number | null
          rationale: string | null
          resource_type: string
          target_allocation_percent: number | null
          updated_at: string
        }
        Insert: {
          allocation_category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_allocation_percent?: number | null
          min_allocation_percent?: number | null
          organization_id: string
          priority?: number | null
          rationale?: string | null
          resource_type: string
          target_allocation_percent?: number | null
          updated_at?: string
        }
        Update: {
          allocation_category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_allocation_percent?: number | null
          min_allocation_percent?: number | null
          organization_id?: string
          priority?: number | null
          rationale?: string | null
          resource_type?: string
          target_allocation_percent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_allocation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_allocation_snapshots: {
        Row: {
          attention_allocation: Json
          created_at: string
          efficiency_score: number | null
          id: string
          money_allocation: Json
          organization_id: string
          recommendations: Json | null
          roi_by_category: Json
          snapshot_date: string
          time_allocation: Json
        }
        Insert: {
          attention_allocation?: Json
          created_at?: string
          efficiency_score?: number | null
          id?: string
          money_allocation?: Json
          organization_id: string
          recommendations?: Json | null
          roi_by_category?: Json
          snapshot_date?: string
          time_allocation?: Json
        }
        Update: {
          attention_allocation?: Json
          created_at?: string
          efficiency_score?: number | null
          id?: string
          money_allocation?: Json
          organization_id?: string
          recommendations?: Json | null
          roi_by_category?: Json
          snapshot_date?: string
          time_allocation?: Json
        }
        Relationships: [
          {
            foreignKeyName: "capital_allocation_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_contracts: {
        Row: {
          allowed_categories: string[] | null
          approved_at: string | null
          approved_by: string | null
          auto_stop_rules: Json | null
          contract_type: string
          created_at: string
          current_deployed: number | null
          current_pnl: number | null
          expires_at: string | null
          id: string
          max_capital: number
          max_loss: number
          organization_id: string
          status: string
          time_horizon_days: number | null
          updated_at: string
        }
        Insert: {
          allowed_categories?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          auto_stop_rules?: Json | null
          contract_type: string
          created_at?: string
          current_deployed?: number | null
          current_pnl?: number | null
          expires_at?: string | null
          id?: string
          max_capital?: number
          max_loss?: number
          organization_id: string
          status?: string
          time_horizon_days?: number | null
          updated_at?: string
        }
        Update: {
          allowed_categories?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          auto_stop_rules?: Json | null
          contract_type?: string
          created_at?: string
          current_deployed?: number | null
          current_pnl?: number | null
          expires_at?: string | null
          id?: string
          max_capital?: number
          max_loss?: number
          organization_id?: string
          status?: string
          time_horizon_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_deployments: {
        Row: {
          capital_deployed: number
          completed_at: string | null
          contract_id: string | null
          created_at: string
          current_step: number | null
          current_value: number | null
          deployment_type: string
          execution_steps: Json | null
          halt_reason: string | null
          id: string
          opportunity_id: string | null
          organization_id: string
          performance_metrics: Json | null
          realized_pnl: number | null
          risk_metrics: Json | null
          started_at: string | null
          status: string
          unrealized_pnl: number | null
          updated_at: string
        }
        Insert: {
          capital_deployed: number
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string
          current_step?: number | null
          current_value?: number | null
          deployment_type: string
          execution_steps?: Json | null
          halt_reason?: string | null
          id?: string
          opportunity_id?: string | null
          organization_id: string
          performance_metrics?: Json | null
          realized_pnl?: number | null
          risk_metrics?: Json | null
          started_at?: string | null
          status?: string
          unrealized_pnl?: number | null
          updated_at?: string
        }
        Update: {
          capital_deployed?: number
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string
          current_step?: number | null
          current_value?: number | null
          deployment_type?: string
          execution_steps?: Json | null
          halt_reason?: string | null
          id?: string
          opportunity_id?: string | null
          organization_id?: string
          performance_metrics?: Json | null
          realized_pnl?: number | null
          risk_metrics?: Json | null
          started_at?: string | null
          status?: string
          unrealized_pnl?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_deployments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "capital_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_deployments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "arbitrage_opportunities_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_deployments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_optimizations: {
        Row: {
          actual_savings: number | null
          approved_at: string | null
          auto_executable: boolean | null
          confidence_score: number | null
          current_state: Json | null
          description: string | null
          detected_at: string
          estimated_monthly_savings: number | null
          estimated_one_time_savings: number | null
          executed_at: string | null
          execution_notes: string | null
          id: string
          optimization_type: string
          organization_id: string
          recommended_action: string | null
          risk_level: string | null
          status: string
          title: string
        }
        Insert: {
          actual_savings?: number | null
          approved_at?: string | null
          auto_executable?: boolean | null
          confidence_score?: number | null
          current_state?: Json | null
          description?: string | null
          detected_at?: string
          estimated_monthly_savings?: number | null
          estimated_one_time_savings?: number | null
          executed_at?: string | null
          execution_notes?: string | null
          id?: string
          optimization_type: string
          organization_id: string
          recommended_action?: string | null
          risk_level?: string | null
          status?: string
          title: string
        }
        Update: {
          actual_savings?: number | null
          approved_at?: string | null
          auto_executable?: boolean | null
          confidence_score?: number | null
          current_state?: Json | null
          description?: string | null
          detected_at?: string
          estimated_monthly_savings?: number | null
          estimated_one_time_savings?: number | null
          executed_at?: string | null
          execution_notes?: string | null
          id?: string
          optimization_type?: string
          organization_id?: string
          recommended_action?: string | null
          risk_level?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_optimizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      category_moves: {
        Row: {
          created_at: string
          executed_at: string | null
          execution_status: string | null
          id: string
          impact_assessment: string | null
          intended_effect: string | null
          market_response: Json | null
          move_description: string
          move_type: string
          organization_id: string
          position_id: string | null
        }
        Insert: {
          created_at?: string
          executed_at?: string | null
          execution_status?: string | null
          id?: string
          impact_assessment?: string | null
          intended_effect?: string | null
          market_response?: Json | null
          move_description: string
          move_type: string
          organization_id: string
          position_id?: string | null
        }
        Update: {
          created_at?: string
          executed_at?: string | null
          execution_status?: string | null
          id?: string
          impact_assessment?: string | null
          intended_effect?: string | null
          market_response?: Json | null
          move_description?: string
          move_type?: string
          organization_id?: string
          position_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_moves_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_moves_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "market_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      causal_relationships: {
        Row: {
          cause_variable: string
          confidence: number | null
          discovered_at: string | null
          effect_variable: string
          id: string
          lag_hours: number | null
          last_validated: string | null
          organization_id: string
          sample_size: number | null
          strength: number
        }
        Insert: {
          cause_variable: string
          confidence?: number | null
          discovered_at?: string | null
          effect_variable: string
          id?: string
          lag_hours?: number | null
          last_validated?: string | null
          organization_id: string
          sample_size?: number | null
          strength: number
        }
        Update: {
          cause_variable?: string
          confidence?: number | null
          discovered_at?: string | null
          effect_variable?: string
          id?: string
          lag_hours?: number | null
          last_validated?: string | null
          organization_id?: string
          sample_size?: number | null
          strength?: number
        }
        Relationships: [
          {
            foreignKeyName: "causal_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          contact_id: string
          course_id: string
          enrollment_id: string
          id: string
          issued_at: string | null
          metadata: Json | null
          pdf_url: string | null
        }
        Insert: {
          certificate_number: string
          contact_id: string
          course_id: string
          enrollment_id: string
          id?: string
          issued_at?: string | null
          metadata?: Json | null
          pdf_url?: string | null
        }
        Update: {
          certificate_number?: string
          contact_id?: string
          course_id?: string
          enrollment_id?: string
          id?: string
          issued_at?: string | null
          metadata?: Json | null
          pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          audit_passed: boolean | null
          badge_url: string | null
          certification_type: string
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string | null
          level: string | null
          organization_id: string
          performance_score: number | null
          renewal_fee: number | null
          status: string | null
          user_id: string
          verification_code: string | null
        }
        Insert: {
          audit_passed?: boolean | null
          badge_url?: string | null
          certification_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          level?: string | null
          organization_id: string
          performance_score?: number | null
          renewal_fee?: number | null
          status?: string | null
          user_id: string
          verification_code?: string | null
        }
        Update: {
          audit_passed?: boolean | null
          badge_url?: string | null
          certification_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          level?: string | null
          organization_id?: string
          performance_score?: number | null
          renewal_fee?: number | null
          status?: string | null
          user_id?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cognition_decisions: {
        Row: {
          actual_value: number | null
          agent_id: string
          autonomy_level: number
          constraints_applied: Json | null
          created_at: string | null
          executed_at: string | null
          expected_value: number | null
          id: string
          inference_chain: Json
          learnings: string[] | null
          opportunity_cost_analysis: Json | null
          options_considered: Json
          organization_id: string
          outcome: Json | null
          outcome_recorded_at: string | null
          reasoning: string
          regret: number | null
          risk_assessment: Json | null
          selected_option: Json
        }
        Insert: {
          actual_value?: number | null
          agent_id: string
          autonomy_level: number
          constraints_applied?: Json | null
          created_at?: string | null
          executed_at?: string | null
          expected_value?: number | null
          id?: string
          inference_chain: Json
          learnings?: string[] | null
          opportunity_cost_analysis?: Json | null
          options_considered: Json
          organization_id: string
          outcome?: Json | null
          outcome_recorded_at?: string | null
          reasoning: string
          regret?: number | null
          risk_assessment?: Json | null
          selected_option: Json
        }
        Update: {
          actual_value?: number | null
          agent_id?: string
          autonomy_level?: number
          constraints_applied?: Json | null
          created_at?: string | null
          executed_at?: string | null
          expected_value?: number | null
          id?: string
          inference_chain?: Json
          learnings?: string[] | null
          opportunity_cost_analysis?: Json | null
          options_considered?: Json
          organization_id?: string
          outcome?: Json | null
          outcome_recorded_at?: string | null
          reasoning?: string
          regret?: number | null
          risk_assessment?: Json | null
          selected_option?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cognition_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          annual_revenue: string | null
          created_at: string | null
          custom_fields: Json | null
          domain: string | null
          id: string
          industry: string | null
          linkedin_url: string | null
          name: string
          organization_id: string
          size: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          annual_revenue?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          domain?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          name: string
          organization_id: string
          size?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          annual_revenue?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          domain?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          name?: string
          organization_id?: string
          size?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_signals: {
        Row: {
          competitor_name: string | null
          created_at: string
          details: Json | null
          detected_at: string
          id: string
          organization_id: string
          responded_at: string | null
          response_action: string | null
          response_required: boolean | null
          severity: string
          signal_type: string
          source: string | null
        }
        Insert: {
          competitor_name?: string | null
          created_at?: string
          details?: Json | null
          detected_at?: string
          id?: string
          organization_id: string
          responded_at?: string | null
          response_action?: string | null
          response_required?: boolean | null
          severity?: string
          signal_type: string
          source?: string | null
        }
        Update: {
          competitor_name?: string | null
          created_at?: string
          details?: Json | null
          detected_at?: string
          id?: string
          organization_id?: string
          responded_at?: string | null
          response_action?: string | null
          response_required?: boolean | null
          severity?: string
          signal_type?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_signals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_alerts: {
        Row: {
          acknowledged: boolean | null
          alert_type: string
          competitor_id: string | null
          created_at: string | null
          id: string
          message: string
          organization_id: string
          recommendation: string | null
          severity: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          alert_type: string
          competitor_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          organization_id: string
          recommendation?: string | null
          severity?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          alert_type?: string
          competitor_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          organization_id?: string
          recommendation?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_alerts_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_profiles: {
        Row: {
          competitor_name: string
          created_at: string | null
          current_offers: Json | null
          current_price: number | null
          id: string
          last_checked_at: string | null
          organization_id: string
          pricing_page_url: string | null
          pricing_selector: string | null
          website_url: string | null
        }
        Insert: {
          competitor_name: string
          created_at?: string | null
          current_offers?: Json | null
          current_price?: number | null
          id?: string
          last_checked_at?: string | null
          organization_id: string
          pricing_page_url?: string | null
          pricing_selector?: string | null
          website_url?: string | null
        }
        Update: {
          competitor_name?: string
          created_at?: string | null
          current_offers?: Json | null
          current_price?: number | null
          id?: string
          last_checked_at?: string | null
          organization_id?: string
          pricing_page_url?: string | null
          pricing_selector?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consequence_simulations: {
        Row: {
          action_description: string
          ai_recommendation: string | null
          confidence_level: number | null
          decision_id: string | null
          delayed_benefits: Json | null
          first_order_effects: Json | null
          hidden_costs: Json | null
          id: string
          net_expected_value: number | null
          organization_id: string
          proceed_recommended: boolean | null
          second_order_effects: Json | null
          simulated_at: string
          third_order_effects: Json | null
          time_horizon_months: number | null
        }
        Insert: {
          action_description: string
          ai_recommendation?: string | null
          confidence_level?: number | null
          decision_id?: string | null
          delayed_benefits?: Json | null
          first_order_effects?: Json | null
          hidden_costs?: Json | null
          id?: string
          net_expected_value?: number | null
          organization_id: string
          proceed_recommended?: boolean | null
          second_order_effects?: Json | null
          simulated_at?: string
          third_order_effects?: Json | null
          time_horizon_months?: number | null
        }
        Update: {
          action_description?: string
          ai_recommendation?: string | null
          confidence_level?: number | null
          decision_id?: string | null
          delayed_benefits?: Json | null
          first_order_effects?: Json | null
          hidden_costs?: Json | null
          id?: string
          net_expected_value?: number | null
          organization_id?: string
          proceed_recommended?: boolean | null
          second_order_effects?: Json | null
          simulated_at?: string
          third_order_effects?: Json | null
          time_horizon_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consequence_simulations_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consequence_simulations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string | null
          first_name: string
          id: string
          is_decision_maker: boolean | null
          last_name: string | null
          lifecycle_stage: string | null
          organization_id: string
          owner_id: string | null
          phone: string | null
          source: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          first_name: string
          id?: string
          is_decision_maker?: boolean | null
          last_name?: string | null
          lifecycle_stage?: string | null
          organization_id: string
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          first_name?: string
          id?: string
          is_decision_maker?: boolean | null
          last_name?: string | null
          lifecycle_stage?: string | null
          organization_id?: string
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_performance_analysis: {
        Row: {
          analysis_period: string
          audience_insights: Json | null
          content_recommendations: Json | null
          created_at: string
          demand_indicators: Json | null
          id: string
          optimal_posting_times: Json | null
          organization_id: string
          period_end: string
          period_start: string
          platform: string | null
          top_performing_topics: string[] | null
          trend_signals: Json | null
          worst_performing_topics: string[] | null
        }
        Insert: {
          analysis_period: string
          audience_insights?: Json | null
          content_recommendations?: Json | null
          created_at?: string
          demand_indicators?: Json | null
          id?: string
          optimal_posting_times?: Json | null
          organization_id: string
          period_end: string
          period_start: string
          platform?: string | null
          top_performing_topics?: string[] | null
          trend_signals?: Json | null
          worst_performing_topics?: string[] | null
        }
        Update: {
          analysis_period?: string
          audience_insights?: Json | null
          content_recommendations?: Json | null
          created_at?: string
          demand_indicators?: Json | null
          id?: string
          optimal_posting_times?: Json | null
          organization_id?: string
          period_end?: string
          period_start?: string
          platform?: string | null
          top_performing_topics?: string[] | null
          trend_signals?: Json | null
          worst_performing_topics?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          avg_watch_time_seconds: number | null
          comments: number | null
          content_url: string | null
          content_variation: string | null
          created_at: string
          hook_category: string | null
          hook_duration_seconds: number | null
          hook_score: number | null
          hook_text: string | null
          id: string
          likes: number | null
          organization_id: string
          platform: string
          post_type: string
          posted_at: string | null
          retention_at_10s: number | null
          retention_at_3s: number | null
          saves: number | null
          shares: number | null
          status: string
          thumbnail_url: string | null
          trend_topic: string | null
          updated_at: string
          views: number | null
          watch_through_rate: number | null
        }
        Insert: {
          avg_watch_time_seconds?: number | null
          comments?: number | null
          content_url?: string | null
          content_variation?: string | null
          created_at?: string
          hook_category?: string | null
          hook_duration_seconds?: number | null
          hook_score?: number | null
          hook_text?: string | null
          id?: string
          likes?: number | null
          organization_id: string
          platform: string
          post_type?: string
          posted_at?: string | null
          retention_at_10s?: number | null
          retention_at_3s?: number | null
          saves?: number | null
          shares?: number | null
          status?: string
          thumbnail_url?: string | null
          trend_topic?: string | null
          updated_at?: string
          views?: number | null
          watch_through_rate?: number | null
        }
        Update: {
          avg_watch_time_seconds?: number | null
          comments?: number | null
          content_url?: string | null
          content_variation?: string | null
          created_at?: string
          hook_category?: string | null
          hook_duration_seconds?: number | null
          hook_score?: number | null
          hook_text?: string | null
          id?: string
          likes?: number | null
          organization_id?: string
          platform?: string
          post_type?: string
          posted_at?: string | null
          retention_at_10s?: number | null
          retention_at_3s?: number | null
          saves?: number | null
          shares?: number | null
          status?: string
          thumbnail_url?: string | null
          trend_topic?: string | null
          updated_at?: string
          views?: number | null
          watch_through_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_queue: {
        Row: {
          content_type: string
          content_url: string | null
          created_at: string
          hook_text: string | null
          id: string
          organization_id: string
          platform: string
          published_at: string | null
          scheduled_at: string | null
          script: string | null
          status: string
          title: string | null
          trend_topic_id: string | null
          updated_at: string
          variation: string
        }
        Insert: {
          content_type: string
          content_url?: string | null
          created_at?: string
          hook_text?: string | null
          id?: string
          organization_id: string
          platform: string
          published_at?: string | null
          scheduled_at?: string | null
          script?: string | null
          status?: string
          title?: string | null
          trend_topic_id?: string | null
          updated_at?: string
          variation: string
        }
        Update: {
          content_type?: string
          content_url?: string | null
          created_at?: string
          hook_text?: string | null
          id?: string
          organization_id?: string
          platform?: string
          published_at?: string | null
          scheduled_at?: string | null
          script?: string | null
          status?: string
          title?: string | null
          trend_topic_id?: string | null
          updated_at?: string
          variation?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_queue_trend_topic_id_fkey"
            columns: ["trend_topic_id"]
            isOneToOne: false
            referencedRelation: "trend_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      course_media: {
        Row: {
          course_id: string | null
          duration_seconds: number | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          lesson_id: string | null
          metadata: Json | null
          mime_type: string | null
          organization_id: string
          uploaded_at: string | null
        }
        Insert: {
          course_id?: string | null
          duration_seconds?: number | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          lesson_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          organization_id: string
          uploaded_at?: string | null
        }
        Update: {
          course_id?: string | null
          duration_seconds?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          lesson_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          organization_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_media_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_media_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          drip_enabled: boolean | null
          id: string
          is_free: boolean | null
          organization_id: string
          price_id: string | null
          settings: Json | null
          slug: string
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          drip_enabled?: boolean | null
          id?: string
          is_free?: boolean | null
          organization_id: string
          price_id?: string | null
          settings?: Json | null
          slug: string
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          drip_enabled?: boolean | null
          id?: string
          is_free?: boolean | null
          organization_id?: string
          price_id?: string | null
          settings?: Json | null
          slug?: string
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts_sync: {
        Row: {
          company: string | null
          created_external_at: string | null
          custom_fields: Json | null
          email: string | null
          external_id: string
          first_name: string | null
          id: string
          last_name: string | null
          lead_score: number | null
          lifecycle_stage: string | null
          organization_id: string
          phone: string | null
          source: string
          synced_at: string
          tags: string[] | null
          updated_external_at: string | null
        }
        Insert: {
          company?: string | null
          created_external_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          external_id: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          lead_score?: number | null
          lifecycle_stage?: string | null
          organization_id: string
          phone?: string | null
          source: string
          synced_at?: string
          tags?: string[] | null
          updated_external_at?: string | null
        }
        Update: {
          company?: string | null
          created_external_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          external_id?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          lead_score?: number | null
          lifecycle_stage?: string | null
          organization_id?: string
          phone?: string | null
          source?: string
          synced_at?: string
          tags?: string[] | null
          updated_external_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_sync_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals_sync: {
        Row: {
          actual_close_date: string | null
          close_probability: number | null
          contact_external_id: string | null
          created_external_at: string | null
          currency: string | null
          days_in_stage: number | null
          deal_name: string | null
          deal_value: number | null
          expected_close_date: string | null
          external_id: string
          id: string
          lost_reason: string | null
          organization_id: string
          pipeline_stage: string | null
          source: string
          synced_at: string
          updated_external_at: string | null
          won: boolean | null
        }
        Insert: {
          actual_close_date?: string | null
          close_probability?: number | null
          contact_external_id?: string | null
          created_external_at?: string | null
          currency?: string | null
          days_in_stage?: number | null
          deal_name?: string | null
          deal_value?: number | null
          expected_close_date?: string | null
          external_id: string
          id?: string
          lost_reason?: string | null
          organization_id: string
          pipeline_stage?: string | null
          source: string
          synced_at?: string
          updated_external_at?: string | null
          won?: boolean | null
        }
        Update: {
          actual_close_date?: string | null
          close_probability?: number | null
          contact_external_id?: string | null
          created_external_at?: string | null
          currency?: string | null
          days_in_stage?: number | null
          deal_name?: string | null
          deal_value?: number | null
          expected_close_date?: string | null
          external_id?: string
          id?: string
          lost_reason?: string | null
          organization_id?: string
          pipeline_stage?: string | null
          source?: string
          synced_at?: string
          updated_external_at?: string | null
          won?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_sync_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          opportunity_id: string | null
          organization_id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          opportunity_id?: string | null
          organization_id: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          opportunity_id?: string | null
          organization_id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_briefs: {
        Row: {
          acted_on: boolean | null
          brief_date: string
          executive_summary: string | null
          generated_at: string
          id: string
          market_signals: Json
          organization_id: string
          pending_approvals: Json
          priority_decisions: Json
          recommended_focus: string | null
          revenue_alerts: Json
          time_allocation: Json
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          acted_on?: boolean | null
          brief_date?: string
          executive_summary?: string | null
          generated_at?: string
          id?: string
          market_signals?: Json
          organization_id: string
          pending_approvals?: Json
          priority_decisions?: Json
          recommended_focus?: string | null
          revenue_alerts?: Json
          time_allocation?: Json
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          acted_on?: boolean | null
          brief_date?: string
          executive_summary?: string | null
          generated_at?: string
          id?: string
          market_signals?: Json
          organization_id?: string
          pending_approvals?: Json
          priority_decisions?: Json
          recommended_focus?: string | null
          revenue_alerts?: Json
          time_allocation?: Json
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_briefs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_intelligence_reports: {
        Row: {
          ai_recommendations: Json | null
          anomalies_detected: Json | null
          auto_actions_taken: Json | null
          executive_summary: string | null
          generated_at: string
          health_score: number | null
          id: string
          key_metrics: Json | null
          opportunities: Json | null
          organization_id: string
          pending_approvals: Json | null
          report_date: string
          risks: Json | null
          viewed_at: string | null
        }
        Insert: {
          ai_recommendations?: Json | null
          anomalies_detected?: Json | null
          auto_actions_taken?: Json | null
          executive_summary?: string | null
          generated_at?: string
          health_score?: number | null
          id?: string
          key_metrics?: Json | null
          opportunities?: Json | null
          organization_id: string
          pending_approvals?: Json | null
          report_date: string
          risks?: Json | null
          viewed_at?: string | null
        }
        Update: {
          ai_recommendations?: Json | null
          anomalies_detected?: Json | null
          auto_actions_taken?: Json | null
          executive_summary?: string | null
          generated_at?: string
          health_score?: number | null
          id?: string
          key_metrics?: Json | null
          opportunities?: Json | null
          organization_id?: string
          pending_approvals?: Json | null
          report_date?: string
          risks?: Json | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_intelligence_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_decisions: {
        Row: {
          created_at: string | null
          decision: string | null
          decision_at: string | null
          decision_deadline: string | null
          decision_made: boolean | null
          id: string
          loss_reason: string | null
          opportunity_id: string
          organization_id: string
          proposal_sent_at: string | null
          touch_count: number | null
          touches: Json | null
          window_days: number | null
        }
        Insert: {
          created_at?: string | null
          decision?: string | null
          decision_at?: string | null
          decision_deadline?: string | null
          decision_made?: boolean | null
          id?: string
          loss_reason?: string | null
          opportunity_id: string
          organization_id: string
          proposal_sent_at?: string | null
          touch_count?: number | null
          touches?: Json | null
          window_days?: number | null
        }
        Update: {
          created_at?: string | null
          decision?: string | null
          decision_at?: string | null
          decision_deadline?: string | null
          decision_made?: boolean | null
          id?: string
          loss_reason?: string | null
          opportunity_id?: string
          organization_id?: string
          proposal_sent_at?: string | null
          touch_count?: number | null
          touches?: Json | null
          window_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_decisions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: true
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_flow_access: {
        Row: {
          access_tier: string
          activated_at: string
          deals_claimed: number | null
          deals_viewed: number | null
          expires_at: string | null
          id: string
          monthly_fee: number
          organization_id: string
          success_fees_paid: number | null
          total_deal_value: number | null
        }
        Insert: {
          access_tier?: string
          activated_at?: string
          deals_claimed?: number | null
          deals_viewed?: number | null
          expires_at?: string | null
          id?: string
          monthly_fee?: number
          organization_id: string
          success_fees_paid?: number | null
          total_deal_value?: number | null
        }
        Update: {
          access_tier?: string
          activated_at?: string
          deals_claimed?: number | null
          deals_viewed?: number | null
          expires_at?: string | null
          id?: string
          monthly_fee?: number
          organization_id?: string
          success_fees_paid?: number | null
          total_deal_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_flow_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_flow_items: {
        Row: {
          ai_score: number | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          deal_type: string
          description: string
          expires_at: string | null
          id: string
          is_exclusive: boolean | null
          minimum_requirements: Json | null
          opportunity_value: number | null
          source: string | null
          status: string
          success_fee_percent: number | null
          title: string
        }
        Insert: {
          ai_score?: number | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          deal_type: string
          description: string
          expires_at?: string | null
          id?: string
          is_exclusive?: boolean | null
          minimum_requirements?: Json | null
          opportunity_value?: number | null
          source?: string | null
          status?: string
          success_fee_percent?: number | null
          title: string
        }
        Update: {
          ai_score?: number | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          deal_type?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_exclusive?: boolean | null
          minimum_requirements?: Json | null
          opportunity_value?: number | null
          source?: string | null
          status?: string
          success_fee_percent?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_flow_items_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_simulations: {
        Row: {
          created_at: string
          currency: string | null
          deal_value: number | null
          id: string
          lead_id: string | null
          objections: Json | null
          organization_id: string | null
          proposal_summary: string
          recommended_responses: Json | null
          risk_factors: Json | null
          strengths: Json | null
          win_probability: number | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          deal_value?: number | null
          id?: string
          lead_id?: string | null
          objections?: Json | null
          organization_id?: string | null
          proposal_summary: string
          recommended_responses?: Json | null
          risk_factors?: Json | null
          strengths?: Json | null
          win_probability?: number | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          deal_value?: number | null
          id?: string
          lead_id?: string | null
          objections?: Json | null
          organization_id?: string | null
          proposal_summary?: string
          recommended_responses?: Json | null
          risk_factors?: Json | null
          strengths?: Json | null
          win_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_simulations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_simulations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_action_outcomes: {
        Row: {
          action_id: string | null
          actual_outcome: Json | null
          alternatives_rejected: Json
          decision_chosen: string
          decision_context: Json
          decision_id: string | null
          id: string
          learning_extracted: string | null
          organization_id: string
          outcome_delta: Json | null
          outcome_recorded_at: string | null
          predicted_outcome: Json
          recorded_at: string
          regret_reason: string | null
          regret_score: number | null
          similar_future_decisions: Json | null
        }
        Insert: {
          action_id?: string | null
          actual_outcome?: Json | null
          alternatives_rejected?: Json
          decision_chosen: string
          decision_context?: Json
          decision_id?: string | null
          id?: string
          learning_extracted?: string | null
          organization_id: string
          outcome_delta?: Json | null
          outcome_recorded_at?: string | null
          predicted_outcome?: Json
          recorded_at?: string
          regret_reason?: string | null
          regret_score?: number | null
          similar_future_decisions?: Json | null
        }
        Update: {
          action_id?: string | null
          actual_outcome?: Json | null
          alternatives_rejected?: Json
          decision_chosen?: string
          decision_context?: Json
          decision_id?: string | null
          id?: string
          learning_extracted?: string | null
          organization_id?: string
          outcome_delta?: Json | null
          outcome_recorded_at?: string | null
          predicted_outcome?: Json
          recorded_at?: string
          regret_reason?: string | null
          regret_score?: number | null
          similar_future_decisions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_action_outcomes_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_action_outcomes_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_action_outcomes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_credits: {
        Row: {
          created_at: string
          credits_purchased: number | null
          credits_remaining: number | null
          credits_used: number | null
          id: string
          monthly_allocation: number | null
          organization_id: string
          overage_rate: number | null
          period_end: string | null
          period_start: string | null
          tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_purchased?: number | null
          credits_remaining?: number | null
          credits_used?: number | null
          id?: string
          monthly_allocation?: number | null
          organization_id: string
          overage_rate?: number | null
          period_end?: string | null
          period_start?: string | null
          tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_purchased?: number | null
          credits_remaining?: number | null
          credits_used?: number | null
          id?: string
          monthly_allocation?: number | null
          organization_id?: string
          overage_rate?: number | null
          period_end?: string | null
          period_start?: string | null
          tier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_credits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_insurance_policies: {
        Row: {
          created_at: string
          decision_id: string | null
          expires_at: string
          guarantee_description: string
          guarantee_period_days: number
          guaranteed_metric: string
          guaranteed_threshold: number
          id: string
          measured_at: string | null
          organization_id: string
          outcome_measured: number | null
          outcome_met: boolean | null
          policy_type: string
          premium_fee: number
          refund_amount: number | null
          refund_percentage: number
          status: string
        }
        Insert: {
          created_at?: string
          decision_id?: string | null
          expires_at: string
          guarantee_description: string
          guarantee_period_days?: number
          guaranteed_metric: string
          guaranteed_threshold: number
          id?: string
          measured_at?: string | null
          organization_id: string
          outcome_measured?: number | null
          outcome_met?: boolean | null
          policy_type: string
          premium_fee: number
          refund_amount?: number | null
          refund_percentage?: number
          status?: string
        }
        Update: {
          created_at?: string
          decision_id?: string | null
          expires_at?: string
          guarantee_description?: string
          guarantee_period_days?: number
          guaranteed_metric?: string
          guaranteed_threshold?: number
          id?: string
          measured_at?: string | null
          organization_id?: string
          outcome_measured?: number | null
          outcome_met?: boolean | null
          policy_type?: string
          premium_fee?: number
          refund_amount?: number | null
          refund_percentage?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_insurance_policies_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_insurance_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_outcomes: {
        Row: {
          created_at: string
          decision_id: string
          id: string
          impact_score: number | null
          observed_at: string
          organization_id: string
          outcome_description: string
          outcome_type: string
        }
        Insert: {
          created_at?: string
          decision_id: string
          id?: string
          impact_score?: number | null
          observed_at?: string
          organization_id: string
          outcome_description: string
          outcome_type: string
        }
        Update: {
          created_at?: string
          decision_id?: string
          id?: string
          impact_score?: number | null
          observed_at?: string
          organization_id?: string
          outcome_description?: string
          outcome_type?: string
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
      decision_quality_scores: {
        Row: {
          actual_outcome: string | null
          alternatives_considered: number | null
          created_at: string
          decision_date: string
          decision_description: string
          decision_id: string | null
          id: string
          information_completeness: number | null
          lesson_learned: string | null
          organization_id: string
          outcome_delta: number | null
          outcome_measured_at: string | null
          outcome_prediction: string | null
          rationale_quality_score: number | null
          regret_score: number | null
          reversibility_score: number | null
        }
        Insert: {
          actual_outcome?: string | null
          alternatives_considered?: number | null
          created_at?: string
          decision_date: string
          decision_description: string
          decision_id?: string | null
          id?: string
          information_completeness?: number | null
          lesson_learned?: string | null
          organization_id: string
          outcome_delta?: number | null
          outcome_measured_at?: string | null
          outcome_prediction?: string | null
          rationale_quality_score?: number | null
          regret_score?: number | null
          reversibility_score?: number | null
        }
        Update: {
          actual_outcome?: string | null
          alternatives_considered?: number | null
          created_at?: string
          decision_date?: string
          decision_description?: string
          decision_id?: string | null
          id?: string
          information_completeness?: number | null
          lesson_learned?: string | null
          organization_id?: string
          outcome_delta?: number | null
          outcome_measured_at?: string | null
          outcome_prediction?: string | null
          rationale_quality_score?: number | null
          regret_score?: number | null
          reversibility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_quality_scores_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_quality_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          assumptions: string[] | null
          block_reason: string | null
          blocked_by_agent: string | null
          cooling_off_until: string | null
          created_at: string
          id: string
          kill_criteria: string[] | null
          message_id: string | null
          metrics_to_track: string[] | null
          next_actions: string[] | null
          options: Json | null
          questions_needed: string[] | null
          recommendation: string
          risks: Json | null
          session_id: string
          status: string
          why_this_wins: string | null
        }
        Insert: {
          assumptions?: string[] | null
          block_reason?: string | null
          blocked_by_agent?: string | null
          cooling_off_until?: string | null
          created_at?: string
          id?: string
          kill_criteria?: string[] | null
          message_id?: string | null
          metrics_to_track?: string[] | null
          next_actions?: string[] | null
          options?: Json | null
          questions_needed?: string[] | null
          recommendation: string
          risks?: Json | null
          session_id: string
          status?: string
          why_this_wins?: string | null
        }
        Update: {
          assumptions?: string[] | null
          block_reason?: string | null
          blocked_by_agent?: string | null
          cooling_off_until?: string | null
          created_at?: string
          id?: string
          kill_criteria?: string[] | null
          message_id?: string | null
          metrics_to_track?: string[] | null
          next_actions?: string[] | null
          options?: Json | null
          questions_needed?: string[] | null
          recommendation?: string
          risks?: Json | null
          session_id?: string
          status?: string
          why_this_wins?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
      deployment_audit_log: {
        Row: {
          decision_reasoning: string | null
          deployment_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          logged_at: string
          organization_id: string
          outcome: Json | null
          roi_impact: number | null
        }
        Insert: {
          decision_reasoning?: string | null
          deployment_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          logged_at?: string
          organization_id: string
          outcome?: Json | null
          roi_impact?: number | null
        }
        Update: {
          decision_reasoning?: string | null
          deployment_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          logged_at?: string
          organization_id?: string
          outcome?: Json | null
          roi_impact?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deployment_audit_log_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "capital_deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployment_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          organization_id: string | null
          output_format: string | null
          questions: Json
          scoring_logic: Json | null
          template_name: string
          template_type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          organization_id?: string | null
          output_format?: string | null
          questions?: Json
          scoring_logic?: Json | null
          template_name: string
          template_type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          organization_id?: string | null
          output_format?: string | null
          questions?: Json
          scoring_logic?: Json | null
          template_name?: string
          template_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_conversations: {
        Row: {
          ai_handling_mode: string | null
          created_at: string
          external_conversation_id: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          messages_count: number | null
          organization_id: string
          platform: string
          sentiment_score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_handling_mode?: string | null
          created_at?: string
          external_conversation_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          messages_count?: number | null
          organization_id: string
          platform: string
          sentiment_score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_handling_mode?: string | null
          created_at?: string
          external_conversation_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          messages_count?: number | null
          organization_id?: string
          platform?: string
          sentiment_score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_moats: {
        Row: {
          building_actions: Json | null
          compounds_with_time: boolean | null
          copyability_score: number | null
          created_at: string
          current_strength: number | null
          description: string | null
          id: string
          moat_type: string
          organization_id: string
          progress_percent: number | null
          status: string | null
          switching_cost_score: number | null
          target_strength: number | null
          time_to_build_months: number | null
          title: string
          updated_at: string
        }
        Insert: {
          building_actions?: Json | null
          compounds_with_time?: boolean | null
          copyability_score?: number | null
          created_at?: string
          current_strength?: number | null
          description?: string | null
          id?: string
          moat_type: string
          organization_id: string
          progress_percent?: number | null
          status?: string | null
          switching_cost_score?: number | null
          target_strength?: number | null
          time_to_build_months?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          building_actions?: Json | null
          compounds_with_time?: boolean | null
          copyability_score?: number | null
          created_at?: string
          current_strength?: number | null
          description?: string | null
          id?: string
          moat_type?: string
          organization_id?: string
          progress_percent?: number | null
          status?: string | null
          switching_cost_score?: number | null
          target_strength?: number | null
          time_to_build_months?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "economic_moats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_partners: {
        Row: {
          affiliate_link: string | null
          avg_rating: number | null
          category: string
          created_at: string
          description: string | null
          id: string
          integration_available: boolean | null
          is_verified: boolean | null
          partner_name: string
          partner_type: string
          referral_commission_percent: number | null
          rev_share_percent: number | null
          total_referrals: number | null
          total_revenue_generated: number | null
        }
        Insert: {
          affiliate_link?: string | null
          avg_rating?: number | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          integration_available?: boolean | null
          is_verified?: boolean | null
          partner_name: string
          partner_type: string
          referral_commission_percent?: number | null
          rev_share_percent?: number | null
          total_referrals?: number | null
          total_revenue_generated?: number | null
        }
        Update: {
          affiliate_link?: string | null
          avg_rating?: number | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          integration_available?: boolean | null
          is_verified?: boolean | null
          partner_name?: string
          partner_type?: string
          referral_commission_percent?: number | null
          rev_share_percent?: number | null
          total_referrals?: number | null
          total_revenue_generated?: number | null
        }
        Relationships: []
      }
      ecosystem_recommendations: {
        Row: {
          business_context: Json
          click_through_at: string | null
          commission_earned: number | null
          converted_at: string | null
          created_at: string
          estimated_roi: string | null
          id: string
          organization_id: string
          partner_id: string | null
          recommendation_reason: string
          recommendation_type: string
          status: string
          urgency: string | null
        }
        Insert: {
          business_context?: Json
          click_through_at?: string | null
          commission_earned?: number | null
          converted_at?: string | null
          created_at?: string
          estimated_roi?: string | null
          id?: string
          organization_id: string
          partner_id?: string | null
          recommendation_reason: string
          recommendation_type: string
          status?: string
          urgency?: string | null
        }
        Update: {
          business_context?: Json
          click_through_at?: string | null
          commission_earned?: number | null
          converted_at?: string | null
          created_at?: string
          estimated_roi?: string | null
          id?: string
          organization_id?: string
          partner_id?: string | null
          recommendation_reason?: string
          recommendation_type?: string
          status?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_recommendations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sending_config: {
        Row: {
          auto_followup_enabled: boolean
          created_at: string
          followup_days: number
          id: string
          max_emails_per_day: number
          max_emails_per_week: number
          max_followups: number
          no_attachments: boolean
          no_links: boolean
          organization_id: string
          plain_text_only: boolean
          require_approval: boolean
          send_days: string[]
          send_window_end: string
          send_window_start: string
          stop_on_reply: boolean
          updated_at: string
        }
        Insert: {
          auto_followup_enabled?: boolean
          created_at?: string
          followup_days?: number
          id?: string
          max_emails_per_day?: number
          max_emails_per_week?: number
          max_followups?: number
          no_attachments?: boolean
          no_links?: boolean
          organization_id: string
          plain_text_only?: boolean
          require_approval?: boolean
          send_days?: string[]
          send_window_end?: string
          send_window_start?: string
          stop_on_reply?: boolean
          updated_at?: string
        }
        Update: {
          auto_followup_enabled?: boolean
          created_at?: string
          followup_days?: number
          id?: string
          max_emails_per_day?: number
          max_emails_per_week?: number
          max_followups?: number
          no_attachments?: boolean
          no_links?: boolean
          organization_id?: string
          plain_text_only?: boolean
          require_approval?: boolean
          send_days?: string[]
          send_window_end?: string
          send_window_start?: string
          stop_on_reply?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sending_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          organization_id: string
          provider: string | null
          provider_message_id: string | null
          rendered_html: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_id: string | null
          to_email: string
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          organization_id: string
          provider?: string | null
          provider_message_id?: string | null
          rendered_html?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          to_email: string
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          organization_id?: string
          provider?: string | null
          provider_message_id?: string | null
          rendered_html?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sync_status: {
        Row: {
          created_at: string
          emails_synced: number | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          organization_id: string
          source: string
          sync_errors: number | null
          user_email: string
        }
        Insert: {
          created_at?: string
          emails_synced?: number | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_id: string
          source: string
          sync_errors?: number | null
          user_email: string
        }
        Update: {
          created_at?: string
          emails_synced?: number | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_id?: string
          source?: string
          sync_errors?: number | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sync_status_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          blocks: Json
          category: string | null
          created_at: string | null
          id: string
          name: string
          organization_id: string
          preview_text: string | null
          stats: Json | null
          status: string | null
          subject_template: string | null
          updated_at: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          blocks?: Json
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          organization_id: string
          preview_text?: string | null
          stats?: Json | null
          status?: string | null
          subject_template?: string | null
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          blocks?: Json
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          preview_text?: string | null
          stats?: Json | null
          status?: string | null
          subject_template?: string | null
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_thread_analysis: {
        Row: {
          ai_suggested_actions: Json | null
          deal_momentum: string | null
          id: string
          intent_signals: string[] | null
          last_message_at: string | null
          lead_id: string | null
          message_count: number | null
          organization_id: string
          our_response_time_avg_minutes: number | null
          participants: string[] | null
          sentiment_trend: string | null
          source: string
          subject: string | null
          synced_at: string
          their_response_time_avg_minutes: number | null
          thread_external_id: string
          urgency_level: string | null
        }
        Insert: {
          ai_suggested_actions?: Json | null
          deal_momentum?: string | null
          id?: string
          intent_signals?: string[] | null
          last_message_at?: string | null
          lead_id?: string | null
          message_count?: number | null
          organization_id: string
          our_response_time_avg_minutes?: number | null
          participants?: string[] | null
          sentiment_trend?: string | null
          source: string
          subject?: string | null
          synced_at?: string
          their_response_time_avg_minutes?: number | null
          thread_external_id: string
          urgency_level?: string | null
        }
        Update: {
          ai_suggested_actions?: Json | null
          deal_momentum?: string | null
          id?: string
          intent_signals?: string[] | null
          last_message_at?: string | null
          lead_id?: string | null
          message_count?: number | null
          organization_id?: string
          our_response_time_avg_minutes?: number | null
          participants?: string[] | null
          sentiment_trend?: string | null
          source?: string
          subject?: string | null
          synced_at?: string
          their_response_time_avg_minutes?: number | null
          thread_external_id?: string
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_thread_analysis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_thread_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          completed_lessons: number | null
          contact_id: string
          course_id: string
          expires_at: string | null
          id: string
          metadata: Json | null
          organization_id: string
          payment_id: string | null
          progress: Json | null
          started_at: string | null
          status: string | null
          total_lessons: number | null
        }
        Insert: {
          completed_at?: string | null
          completed_lessons?: number | null
          contact_id: string
          course_id: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          payment_id?: string | null
          progress?: Json | null
          started_at?: string | null
          status?: string | null
          total_lessons?: number | null
        }
        Update: {
          completed_at?: string | null
          completed_lessons?: number | null
          contact_id?: string
          course_id?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          payment_id?: string | null
          progress?: Json | null
          started_at?: string | null
          status?: string | null
          total_lessons?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_results: {
        Row: {
          actual_output: Json | null
          duration_ms: number | null
          error_message: string | null
          eval_type: string
          executed_at: string
          expected_output: Json | null
          id: string
          input_data: Json | null
          organization_id: string | null
          passed: boolean | null
          prompt_version_id: string | null
          score: number | null
        }
        Insert: {
          actual_output?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          eval_type: string
          executed_at?: string
          expected_output?: Json | null
          id?: string
          input_data?: Json | null
          organization_id?: string | null
          passed?: boolean | null
          prompt_version_id?: string | null
          score?: number | null
        }
        Update: {
          actual_output?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          eval_type?: string
          executed_at?: string
          expected_output?: Json | null
          id?: string
          input_data?: Json | null
          organization_id?: string | null
          passed?: boolean | null
          prompt_version_id?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_results_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_tasks: {
        Row: {
          agent_type: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json | null
          max_retries: number | null
          metadata: Json | null
          organization_id: string
          output_data: Json | null
          parent_task_id: string | null
          priority: number
          retry_count: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          task_type: string
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          agent_type: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          max_retries?: number | null
          metadata?: Json | null
          organization_id: string
          output_data?: Json | null
          parent_task_id?: string | null
          priority?: number
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          task_type: string
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          agent_type?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          max_retries?: number | null
          metadata?: Json | null
          organization_id?: string
          output_data?: Json | null
          parent_task_id?: string | null
          priority?: number
          retry_count?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          task_type?: string
          updated_at?: string
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
          {
            foreignKeyName: "execution_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "execution_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_tasks_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_briefings: {
        Row: {
          board_memo: string | null
          briefing_type: string
          created_at: string
          delivered_at: string | null
          executive_summary: string
          id: string
          key_decisions: Json
          opportunities: Json
          organization_id: string
          recommended_actions: Json
          risks_identified: Json
          shadow_id: string
          status: string
          title: string
        }
        Insert: {
          board_memo?: string | null
          briefing_type: string
          created_at?: string
          delivered_at?: string | null
          executive_summary: string
          id?: string
          key_decisions?: Json
          opportunities?: Json
          organization_id: string
          recommended_actions?: Json
          risks_identified?: Json
          shadow_id: string
          status?: string
          title: string
        }
        Update: {
          board_memo?: string | null
          briefing_type?: string
          created_at?: string
          delivered_at?: string | null
          executive_summary?: string
          id?: string
          key_decisions?: Json
          opportunities?: Json
          organization_id?: string
          recommended_actions?: Json
          risks_identified?: Json
          shadow_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_briefings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_briefings_shadow_id_fkey"
            columns: ["shadow_id"]
            isOneToOne: false
            referencedRelation: "executive_shadows"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_shadows: {
        Row: {
          capabilities: Json
          created_at: string
          decision_authority_level: string | null
          id: string
          is_active: boolean
          last_briefing_at: string | null
          monthly_fee: number
          organization_id: string
          shadow_role: string
          total_decisions_prepared: number | null
          total_risks_flagged: number | null
        }
        Insert: {
          capabilities?: Json
          created_at?: string
          decision_authority_level?: string | null
          id?: string
          is_active?: boolean
          last_briefing_at?: string | null
          monthly_fee?: number
          organization_id: string
          shadow_role: string
          total_decisions_prepared?: number | null
          total_risks_flagged?: number | null
        }
        Update: {
          capabilities?: Json
          created_at?: string
          decision_authority_level?: string | null
          id?: string
          is_active?: boolean
          last_briefing_at?: string | null
          monthly_fee?: number
          organization_id?: string
          shadow_role?: string
          total_decisions_prepared?: number | null
          total_risks_flagged?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "executive_shadows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      failure_modes: {
        Row: {
          blocks_growth_actions: boolean | null
          category: string
          combined_risk_score: number | null
          created_at: string
          description: string | null
          detected_at: string
          id: string
          impact_score: number | null
          likelihood_score: number | null
          mitigated_at: string | null
          mitigation_plan: string | null
          mitigation_required: boolean | null
          mitigation_status: string | null
          organization_id: string
          time_horizon_months: number | null
          title: string
          updated_at: string
        }
        Insert: {
          blocks_growth_actions?: boolean | null
          category: string
          combined_risk_score?: number | null
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          impact_score?: number | null
          likelihood_score?: number | null
          mitigated_at?: string | null
          mitigation_plan?: string | null
          mitigation_required?: boolean | null
          mitigation_status?: string | null
          organization_id: string
          time_horizon_months?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          blocks_growth_actions?: boolean | null
          category?: string
          combined_risk_score?: number | null
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          impact_score?: number | null
          likelihood_score?: number | null
          mitigated_at?: string | null
          mitigation_plan?: string | null
          mitigation_required?: boolean | null
          mitigation_status?: string | null
          organization_id?: string
          time_horizon_months?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "failure_modes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_metrics_daily: {
        Row: {
          arr: number | null
          average_order_value: number | null
          burn_rate: number | null
          cash_flow: number | null
          churned_customers: number | null
          created_at: string
          expenses: number | null
          gross_revenue: number | null
          id: string
          ltv_estimate: number | null
          metric_date: string
          mrr: number | null
          net_revenue: number | null
          new_customers: number | null
          organization_id: string
          refunds: number | null
          runway_days: number | null
        }
        Insert: {
          arr?: number | null
          average_order_value?: number | null
          burn_rate?: number | null
          cash_flow?: number | null
          churned_customers?: number | null
          created_at?: string
          expenses?: number | null
          gross_revenue?: number | null
          id?: string
          ltv_estimate?: number | null
          metric_date: string
          mrr?: number | null
          net_revenue?: number | null
          new_customers?: number | null
          organization_id: string
          refunds?: number | null
          runway_days?: number | null
        }
        Update: {
          arr?: number | null
          average_order_value?: number | null
          burn_rate?: number | null
          cash_flow?: number | null
          churned_customers?: number | null
          created_at?: string
          expenses?: number | null
          gross_revenue?: number | null
          id?: string
          ltv_estimate?: number | null
          metric_date?: string
          mrr?: number | null
          net_revenue?: number | null
          new_customers?: number | null
          organization_id?: string
          refunds?: number | null
          runway_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_metrics_daily_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          currency: string | null
          customer_email: string | null
          customer_id: string | null
          description: string | null
          external_id: string | null
          id: string
          metadata: Json | null
          organization_id: string
          source: string
          status: string | null
          synced_at: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          source: string
          status?: string | null
          synced_at?: string
          transaction_date: string
          transaction_type: string
        }
        Update: {
          amount?: number
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          source?: string
          status?: string | null
          synced_at?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          answers: Json
          contact_id: string | null
          form_id: string
          id: string
          metadata: Json | null
          organization_id: string
          route: string | null
          score: number | null
          submitted_at: string | null
          tags_applied: string[] | null
        }
        Insert: {
          answers?: Json
          contact_id?: string | null
          form_id: string
          id?: string
          metadata?: Json | null
          organization_id: string
          route?: string | null
          score?: number | null
          submitted_at?: string | null
          tags_applied?: string[] | null
        }
        Update: {
          answers?: Json
          contact_id?: string | null
          form_id?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          route?: string | null
          score?: number | null
          submitted_at?: string | null
          tags_applied?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string | null
          description: string | null
          fields: Json
          form_type: string | null
          id: string
          name: string
          organization_id: string
          redirect_url: string | null
          settings: Json | null
          slug: string
          status: string | null
          styling: Json | null
          submission_count: number | null
          thank_you_message: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          form_type?: string | null
          id?: string
          name: string
          organization_id: string
          redirect_url?: string | null
          settings?: Json | null
          slug: string
          status?: string | null
          styling?: Json | null
          submission_count?: number | null
          thank_you_message?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          form_type?: string | null
          id?: string
          name?: string
          organization_id?: string
          redirect_url?: string | null
          settings?: Json | null
          slug?: string
          status?: string | null
          styling?: Json | null
          submission_count?: number | null
          thank_you_message?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_organization_id_fkey"
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
          detected_patterns: string[] | null
          energy_level: number | null
          id: string
          logged_at: string
          notes: string | null
          organization_id: string
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          decision_clarity?: number | null
          detected_patterns?: string[] | null
          energy_level?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          organization_id: string
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          decision_clarity?: number | null
          detected_patterns?: string[] | null
          energy_level?: number | null
          id?: string
          logged_at?: string
          notes?: string | null
          organization_id?: string
          user_id?: string
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
      founder_substitution_index: {
        Row: {
          authority_dependency: number | null
          automation_opportunities: string[] | null
          bottleneck_areas: string[] | null
          change_from_last: number | null
          created_at: string | null
          creativity_dependency: number | null
          decision_dependency: number | null
          delegation_opportunities: string[] | null
          emotional_dependency: number | null
          id: string
          measurement_date: string
          organization_id: string
          overall_dependency: number | null
          relationship_dependency: number | null
          replacement_readiness: number | null
          sales_dependency: number | null
          trend: string | null
        }
        Insert: {
          authority_dependency?: number | null
          automation_opportunities?: string[] | null
          bottleneck_areas?: string[] | null
          change_from_last?: number | null
          created_at?: string | null
          creativity_dependency?: number | null
          decision_dependency?: number | null
          delegation_opportunities?: string[] | null
          emotional_dependency?: number | null
          id?: string
          measurement_date?: string
          organization_id: string
          overall_dependency?: number | null
          relationship_dependency?: number | null
          replacement_readiness?: number | null
          sales_dependency?: number | null
          trend?: string | null
        }
        Update: {
          authority_dependency?: number | null
          automation_opportunities?: string[] | null
          bottleneck_areas?: string[] | null
          change_from_last?: number | null
          created_at?: string | null
          creativity_dependency?: number | null
          decision_dependency?: number | null
          delegation_opportunities?: string[] | null
          emotional_dependency?: number | null
          id?: string
          measurement_date?: string
          organization_id?: string
          overall_dependency?: number | null
          relationship_dependency?: number | null
          replacement_readiness?: number | null
          sales_dependency?: number | null
          trend?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_substitution_index_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_analysis: {
        Row: {
          ai_recommendations: Json | null
          analysis_date: string
          created_at: string
          drop_off_points: Json | null
          estimated_revenue_lift: number | null
          friction_points: Json | null
          funnel_name: string
          id: string
          organization_id: string
          overall_conversion_rate: number | null
          step_conversion_rates: Json | null
          total_completions: number | null
          total_entries: number | null
        }
        Insert: {
          ai_recommendations?: Json | null
          analysis_date: string
          created_at?: string
          drop_off_points?: Json | null
          estimated_revenue_lift?: number | null
          friction_points?: Json | null
          funnel_name: string
          id?: string
          organization_id: string
          overall_conversion_rate?: number | null
          step_conversion_rates?: Json | null
          total_completions?: number | null
          total_entries?: number | null
        }
        Update: {
          ai_recommendations?: Json | null
          analysis_date?: string
          created_at?: string
          drop_off_points?: Json | null
          estimated_revenue_lift?: number | null
          friction_points?: Json | null
          funnel_name?: string
          id?: string
          organization_id?: string
          overall_conversion_rate?: number | null
          step_conversion_rates?: Json | null
          total_completions?: number | null
          total_entries?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          completed: boolean | null
          event_timestamp: string
          funnel_name: string
          id: string
          metadata: Json | null
          organization_id: string
          session_id: string | null
          source: string
          step_name: string
          step_order: number
          synced_at: string
          time_on_step_seconds: number | null
          visitor_id: string | null
        }
        Insert: {
          completed?: boolean | null
          event_timestamp: string
          funnel_name: string
          id?: string
          metadata?: Json | null
          organization_id: string
          session_id?: string | null
          source: string
          step_name: string
          step_order: number
          synced_at?: string
          time_on_step_seconds?: number | null
          visitor_id?: string | null
        }
        Update: {
          completed?: boolean | null
          event_timestamp?: string
          funnel_name?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          session_id?: string | null
          source?: string
          step_name?: string
          step_order?: number
          synced_at?: string
          time_on_step_seconds?: number | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      future_simulations: {
        Row: {
          id: string
          organization_id: string
          probability_score: number | null
          projected_outcomes: Json
          recommended: boolean | null
          scenario_type: string
          simulated_at: string
          simulation_name: string
          strategy_changes: Json
          twin_snapshot_id: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          probability_score?: number | null
          projected_outcomes?: Json
          recommended?: boolean | null
          scenario_type: string
          simulated_at?: string
          simulation_name: string
          strategy_changes?: Json
          twin_snapshot_id?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          probability_score?: number | null
          projected_outcomes?: Json
          recommended?: boolean | null
          scenario_type?: string
          simulated_at?: string
          simulation_name?: string
          strategy_changes?: Json
          twin_snapshot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "future_simulations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "future_simulations_twin_snapshot_id_fkey"
            columns: ["twin_snapshot_id"]
            isOneToOne: false
            referencedRelation: "business_digital_twin"
            referencedColumns: ["id"]
          },
        ]
      }
      global_niche_wisdom: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          industry_type: string
          insight: string
          pattern_type: string
          promoted_to_master: boolean | null
          sample_size: number | null
          success_rate: number | null
          suggested_prompt_fragment: string | null
          trigger_context: Json | null
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          industry_type: string
          insight: string
          pattern_type: string
          promoted_to_master?: boolean | null
          sample_size?: number | null
          success_rate?: number | null
          suggested_prompt_fragment?: string | null
          trigger_context?: Json | null
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          industry_type?: string
          insight?: string
          pattern_type?: string
          promoted_to_master?: boolean | null
          sample_size?: number | null
          success_rate?: number | null
          suggested_prompt_fragment?: string | null
          trigger_context?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      golden_dataset: {
        Row: {
          created_at: string
          expected_output: Json
          id: string
          input_data: Json
          is_active: boolean | null
          organization_id: string | null
          quality_criteria: Json | null
          test_name: string
          test_type: string
        }
        Insert: {
          created_at?: string
          expected_output: Json
          id?: string
          input_data: Json
          is_active?: boolean | null
          organization_id?: string | null
          quality_criteria?: Json | null
          test_name: string
          test_type: string
        }
        Update: {
          created_at?: string
          expected_output?: Json
          id?: string
          input_data?: Json
          is_active?: boolean | null
          organization_id?: string | null
          quality_criteria?: Json | null
          test_name?: string
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "golden_dataset_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hook_patterns: {
        Row: {
          avg_retention: number | null
          created_at: string
          discovered_at: string
          example_hooks: string[] | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          organization_id: string
          pattern_name: string
          pattern_structure: string
          success_rate: number | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          avg_retention?: number | null
          created_at?: string
          discovered_at?: string
          example_hooks?: string[] | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          organization_id: string
          pattern_name: string
          pattern_structure: string
          success_rate?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          avg_retention?: number | null
          created_at?: string
          discovered_at?: string
          example_hooks?: string[] | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          organization_id?: string
          pattern_name?: string
          pattern_structure?: string
          success_rate?: number | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hook_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      immune_system_rules: {
        Row: {
          action: string
          conditions: Json
          created_at: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          organization_id: string
          rule_name: string
          rule_type: string
          times_triggered: number | null
        }
        Insert: {
          action: string
          conditions: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          organization_id: string
          rule_name: string
          rule_type: string
          times_triggered?: number | null
        }
        Update: {
          action?: string
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          organization_id?: string
          rule_name?: string
          rule_type?: string
          times_triggered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "immune_system_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_presets: {
        Row: {
          auto_detect_patterns: Json | null
          closing_loops: Json | null
          created_at: string | null
          default_cta: string | null
          id: string
          industry_code: string
          industry_name: string
          pivot_patterns: Json | null
          primary_sources: string[] | null
          product_type: string | null
          success_tool: string | null
          urgency_triggers: string[] | null
        }
        Insert: {
          auto_detect_patterns?: Json | null
          closing_loops?: Json | null
          created_at?: string | null
          default_cta?: string | null
          id?: string
          industry_code: string
          industry_name: string
          pivot_patterns?: Json | null
          primary_sources?: string[] | null
          product_type?: string | null
          success_tool?: string | null
          urgency_triggers?: string[] | null
        }
        Update: {
          auto_detect_patterns?: Json | null
          closing_loops?: Json | null
          created_at?: string | null
          default_cta?: string | null
          id?: string
          industry_code?: string
          industry_name?: string
          pivot_patterns?: Json | null
          primary_sources?: string[] | null
          product_type?: string | null
          success_tool?: string | null
          urgency_triggers?: string[] | null
        }
        Relationships: []
      }
      inner_circle_experiments: {
        Row: {
          completed_at: string | null
          created_at: string
          current_participants: number | null
          description: string
          experiment_name: string
          hypothesis: string | null
          id: string
          min_participants: number | null
          results: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_participants?: number | null
          description: string
          experiment_name: string
          hypothesis?: string | null
          id?: string
          min_participants?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_participants?: number | null
          description?: string
          experiment_name?: string
          hypothesis?: string | null
          id?: string
          min_participants?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      inner_circle_members: {
        Row: {
          experiments_participated: number | null
          expires_at: string | null
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          roadmap_influence_votes: number | null
          status: string
          tier_id: string
          user_id: string
        }
        Insert: {
          experiments_participated?: number | null
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          roadmap_influence_votes?: number | null
          status?: string
          tier_id: string
          user_id: string
        }
        Update: {
          experiments_participated?: number | null
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          roadmap_influence_votes?: number | null
          status?: string
          tier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inner_circle_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inner_circle_members_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "inner_circle_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      inner_circle_tiers: {
        Row: {
          annual_fee: number
          benefits: Json
          created_at: string
          current_seats: number | null
          id: string
          is_invite_only: boolean | null
          max_seats: number
          requirements: Json | null
          tier_name: string
        }
        Insert: {
          annual_fee: number
          benefits?: Json
          created_at?: string
          current_seats?: number | null
          id?: string
          is_invite_only?: boolean | null
          max_seats: number
          requirements?: Json | null
          tier_name: string
        }
        Update: {
          annual_fee?: number
          benefits?: Json
          created_at?: string
          current_seats?: number | null
          id?: string
          is_invite_only?: boolean | null
          max_seats?: number
          requirements?: Json | null
          tier_name?: string
        }
        Relationships: []
      }
      insurance_claims: {
        Row: {
          claim_amount: number
          claim_reason: string
          created_at: string
          denial_reason: string | null
          evidence: Json
          id: string
          organization_id: string
          paid_at: string | null
          policy_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          claim_amount: number
          claim_reason: string
          created_at?: string
          denial_reason?: string | null
          evidence?: Json
          id?: string
          organization_id: string
          paid_at?: string | null
          policy_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          claim_amount?: number
          claim_reason?: string
          created_at?: string
          denial_reason?: string | null
          evidence?: Json
          id?: string
          organization_id?: string
          paid_at?: string | null
          policy_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "decision_insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          config: Json | null
          connected_at: string | null
          connected_by: string | null
          created_at: string
          credentials_stored: boolean | null
          error_message: string | null
          id: string
          integration_key: string
          is_active: boolean | null
          last_sync_at: string | null
          organization_id: string
          status: string | null
          sync_frequency_minutes: number | null
          updated_at: string
        }
        Insert: {
          config?: Json | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          credentials_stored?: boolean | null
          error_message?: string | null
          id?: string
          integration_key: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_id: string
          status?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string
        }
        Update: {
          config?: Json | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          credentials_stored?: boolean | null
          error_message?: string | null
          id?: string
          integration_key?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          organization_id?: string
          status?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_definitions: {
        Row: {
          ai_capabilities: string[] | null
          category: string
          created_at: string
          data_types_collected: string[] | null
          description: string | null
          docs_url: string | null
          icon_name: string | null
          id: string
          integration_key: string
          is_read_only: boolean | null
          is_required: boolean | null
          name: string
          oauth_required: boolean | null
          priority: number | null
          secret_keys: string[] | null
          setup_url: string | null
          status: string | null
        }
        Insert: {
          ai_capabilities?: string[] | null
          category: string
          created_at?: string
          data_types_collected?: string[] | null
          description?: string | null
          docs_url?: string | null
          icon_name?: string | null
          id?: string
          integration_key: string
          is_read_only?: boolean | null
          is_required?: boolean | null
          name: string
          oauth_required?: boolean | null
          priority?: number | null
          secret_keys?: string[] | null
          setup_url?: string | null
          status?: string | null
        }
        Update: {
          ai_capabilities?: string[] | null
          category?: string
          created_at?: string
          data_types_collected?: string[] | null
          description?: string | null
          docs_url?: string | null
          icon_name?: string | null
          id?: string
          integration_key?: string
          is_read_only?: boolean | null
          is_required?: boolean | null
          name?: string
          oauth_required?: boolean | null
          priority?: number | null
          secret_keys?: string[] | null
          setup_url?: string | null
          status?: string | null
        }
        Relationships: []
      }
      integration_sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          integration_key: string
          metadata: Json | null
          organization_id: string
          records_synced: number | null
          started_at: string
          status: string
          sync_type: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          integration_key: string
          metadata?: Json | null
          organization_id: string
          records_synced?: number | null
          started_at?: string
          status: string
          sync_type?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          integration_key?: string
          metadata?: Json | null
          organization_id?: string
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string
          credentials_encrypted: string | null
          id: string
          last_sync_at: string | null
          organization_id: string
          provider: string
          scopes: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id: string
          provider: string
          scopes?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string
          provider?: string
          scopes?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          contact_id: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          line_items: Json | null
          metadata: Json | null
          notes: string | null
          organization_id: string
          paid_at: string | null
          status: string | null
          stripe_invoice_id: string | null
          subtotal: number | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          line_items?: Json | null
          metadata?: Json | null
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          line_items?: Json | null
          metadata?: Json | null
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kill_switch_events: {
        Row: {
          action_taken: string
          auto_triggered: boolean | null
          contract_id: string | null
          deployment_id: string | null
          id: string
          organization_id: string
          override_reason: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          threshold_value: Json | null
          trigger_type: string
          trigger_value: Json | null
          triggered_at: string
          user_override: boolean | null
        }
        Insert: {
          action_taken: string
          auto_triggered?: boolean | null
          contract_id?: string | null
          deployment_id?: string | null
          id?: string
          organization_id: string
          override_reason?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          threshold_value?: Json | null
          trigger_type: string
          trigger_value?: Json | null
          triggered_at?: string
          user_override?: boolean | null
        }
        Update: {
          action_taken?: string
          auto_triggered?: boolean | null
          contract_id?: string | null
          deployment_id?: string | null
          id?: string
          organization_id?: string
          override_reason?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          threshold_value?: Json | null
          trigger_type?: string
          trigger_value?: Json | null
          triggered_at?: string
          user_override?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "kill_switch_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "capital_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kill_switch_events_deployment_id_fkey"
            columns: ["deployment_id"]
            isOneToOne: false
            referencedRelation: "capital_deployments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kill_switch_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          access_count: number | null
          content_preview: string | null
          document_type: string | null
          external_id: string
          full_content: string | null
          id: string
          is_archived: boolean | null
          last_accessed_at: string | null
          last_modified_at: string | null
          organization_id: string
          source: string
          synced_at: string
          tags: string[] | null
          title: string
          vector_embedded: boolean | null
        }
        Insert: {
          access_count?: number | null
          content_preview?: string | null
          document_type?: string | null
          external_id: string
          full_content?: string | null
          id?: string
          is_archived?: boolean | null
          last_accessed_at?: string | null
          last_modified_at?: string | null
          organization_id: string
          source: string
          synced_at?: string
          tags?: string[] | null
          title: string
          vector_embedded?: boolean | null
        }
        Update: {
          access_count?: number | null
          content_preview?: string | null
          document_type?: string | null
          external_id?: string
          full_content?: string | null
          id?: string
          is_archived?: boolean | null
          last_accessed_at?: string | null
          last_modified_at?: string | null
          organization_id?: string
          source?: string
          synced_at?: string
          tags?: string[] | null
          title?: string
          vector_embedded?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_ingestion_jobs: {
        Row: {
          chunks_created: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          organization_id: string
          pages_found: number | null
          pages_processed: number | null
          source_url: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          chunks_created?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          organization_id: string
          pages_found?: number | null
          pages_processed?: number | null
          source_url?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          chunks_created?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          organization_id?: string
          pages_found?: number | null
          pages_processed?: number | null
          source_url?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_ingestion_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_buyers: {
        Row: {
          avg_lead_quality_rating: number | null
          buyer_company: string | null
          buyer_email: string | null
          buyer_name: string
          created_at: string
          current_month_volume: number | null
          id: string
          is_active: boolean | null
          max_cpl: number | null
          min_quality_score: number | null
          monthly_volume_cap: number | null
          niches: string[] | null
          organization_id: string
          payment_terms: string | null
          stripe_customer_id: string | null
          total_leads_purchased: number | null
          total_spent: number | null
          trust_score: number | null
          updated_at: string
        }
        Insert: {
          avg_lead_quality_rating?: number | null
          buyer_company?: string | null
          buyer_email?: string | null
          buyer_name: string
          created_at?: string
          current_month_volume?: number | null
          id?: string
          is_active?: boolean | null
          max_cpl?: number | null
          min_quality_score?: number | null
          monthly_volume_cap?: number | null
          niches?: string[] | null
          organization_id: string
          payment_terms?: string | null
          stripe_customer_id?: string | null
          total_leads_purchased?: number | null
          total_spent?: number | null
          trust_score?: number | null
          updated_at?: string
        }
        Update: {
          avg_lead_quality_rating?: number | null
          buyer_company?: string | null
          buyer_email?: string | null
          buyer_name?: string
          created_at?: string
          current_month_volume?: number | null
          id?: string
          is_active?: boolean | null
          max_cpl?: number | null
          min_quality_score?: number | null
          monthly_volume_cap?: number | null
          niches?: string[] | null
          organization_id?: string
          payment_terms?: string | null
          stripe_customer_id?: string | null
          total_leads_purchased?: number | null
          total_spent?: number | null
          trust_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_buyers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_listings: {
        Row: {
          asking_price: number | null
          buyer_org_id: string | null
          company_size: string | null
          created_at: string
          description: string | null
          id: string
          industry: string | null
          intent_level: string | null
          lead_id: string | null
          listing_type: string | null
          organization_id: string
          platform_fee: number | null
          quality_score: number | null
          sold_at: string | null
          sold_price: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          asking_price?: number | null
          buyer_org_id?: string | null
          company_size?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          intent_level?: string | null
          lead_id?: string | null
          listing_type?: string | null
          organization_id: string
          platform_fee?: number | null
          quality_score?: number | null
          sold_at?: string | null
          sold_price?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          asking_price?: number | null
          buyer_org_id?: string | null
          company_size?: string | null
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          intent_level?: string | null
          lead_id?: string | null
          listing_type?: string | null
          organization_id?: string
          platform_fee?: number | null
          quality_score?: number | null
          sold_at?: string | null
          sold_price?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_listings_buyer_org_id_fkey"
            columns: ["buyer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_listings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_listings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scores: {
        Row: {
          behavioral_signals: Json | null
          capacity_score: number | null
          ear_score: number | null
          economic_potential: Json | null
          efficiency_score: number | null
          id: string
          identity_signals: Json | null
          intent_score: number | null
          lead_id: string
          model_version: string | null
          organization_id: string
          risk_flags: string[] | null
          routing_decision: string | null
          routing_reasoning: string | null
          scored_at: string | null
          source_trust_weight: number | null
          website_signals: Json | null
        }
        Insert: {
          behavioral_signals?: Json | null
          capacity_score?: number | null
          ear_score?: number | null
          economic_potential?: Json | null
          efficiency_score?: number | null
          id?: string
          identity_signals?: Json | null
          intent_score?: number | null
          lead_id: string
          model_version?: string | null
          organization_id: string
          risk_flags?: string[] | null
          routing_decision?: string | null
          routing_reasoning?: string | null
          scored_at?: string | null
          source_trust_weight?: number | null
          website_signals?: Json | null
        }
        Update: {
          behavioral_signals?: Json | null
          capacity_score?: number | null
          ear_score?: number | null
          economic_potential?: Json | null
          efficiency_score?: number | null
          id?: string
          identity_signals?: Json | null
          intent_score?: number | null
          lead_id?: string
          model_version?: string | null
          organization_id?: string
          risk_flags?: string[] | null
          routing_decision?: string | null
          routing_reasoning?: string | null
          scored_at?: string | null
          source_trust_weight?: number | null
          website_signals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_workflow: string | null
          created_at: string
          ear_score: number | null
          email: string | null
          engagement_score: number | null
          external_id: string | null
          id: string
          intent_score: number | null
          last_interaction_at: string | null
          last_objection: string | null
          last_resurrection_at: string | null
          name: string | null
          next_followup_at: string | null
          notes: string | null
          nurture_track: string | null
          organization_id: string
          phone: string | null
          platform: string | null
          qualification_data: Json | null
          reactivation_count: number | null
          requalify_at: string | null
          resurrection_status: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_workflow?: string | null
          created_at?: string
          ear_score?: number | null
          email?: string | null
          engagement_score?: number | null
          external_id?: string | null
          id?: string
          intent_score?: number | null
          last_interaction_at?: string | null
          last_objection?: string | null
          last_resurrection_at?: string | null
          name?: string | null
          next_followup_at?: string | null
          notes?: string | null
          nurture_track?: string | null
          organization_id: string
          phone?: string | null
          platform?: string | null
          qualification_data?: Json | null
          reactivation_count?: number | null
          requalify_at?: string | null
          resurrection_status?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_workflow?: string | null
          created_at?: string
          ear_score?: number | null
          email?: string | null
          engagement_score?: number | null
          external_id?: string | null
          id?: string
          intent_score?: number | null
          last_interaction_at?: string | null
          last_objection?: string | null
          last_resurrection_at?: string | null
          name?: string | null
          next_followup_at?: string | null
          notes?: string | null
          nurture_track?: string | null
          organization_id?: string
          phone?: string | null
          platform?: string | null
          qualification_data?: Json | null
          reactivation_count?: number | null
          requalify_at?: string | null
          resurrection_status?: string | null
          source?: string
          status?: string
          updated_at?: string
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
      learning_events: {
        Row: {
          agent_id: string | null
          applicability: string | null
          applied: boolean | null
          confidence: number | null
          created_at: string | null
          id: string
          insight: string
          learning_type: string
          organization_id: string
          source_decision_id: string | null
        }
        Insert: {
          agent_id?: string | null
          applicability?: string | null
          applied?: boolean | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          insight: string
          learning_type: string
          organization_id: string
          source_decision_id?: string | null
        }
        Update: {
          agent_id?: string | null
          applicability?: string | null
          applied?: boolean | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          insight?: string
          learning_type?: string
          organization_id?: string
          source_decision_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_events_source_decision_id_fkey"
            columns: ["source_decision_id"]
            isOneToOne: false
            referencedRelation: "cognition_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attachments: Json | null
          content_blocks: Json | null
          content_html: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_preview: boolean | null
          module_id: string
          position: number
          title: string
          updated_at: string | null
          video_provider: string | null
          video_url: string | null
        }
        Insert: {
          attachments?: Json | null
          content_blocks?: Json | null
          content_html?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          module_id: string
          position: number
          title: string
          updated_at?: string | null
          video_provider?: string | null
          video_url?: string | null
        }
        Update: {
          attachments?: Json | null
          content_blocks?: Json | null
          content_html?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          module_id?: string
          position?: number
          title?: string
          updated_at?: string | null
          video_provider?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      license_tenants: {
        Row: {
          active_seats: number | null
          active_sub_orgs: number | null
          branding_config: Json | null
          created_at: string
          current_tier: string | null
          features_enabled: Json | null
          id: string
          license_tier: string | null
          monthly_fee: number | null
          parent_org_id: string
          per_seat_fee: number | null
          per_sub_org_fee: number | null
          policy_template_id: string | null
          seat_limit: number | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          sub_org_limit: number | null
          subscription_status: string | null
          tenant_name: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          active_seats?: number | null
          active_sub_orgs?: number | null
          branding_config?: Json | null
          created_at?: string
          current_tier?: string | null
          features_enabled?: Json | null
          id?: string
          license_tier?: string | null
          monthly_fee?: number | null
          parent_org_id: string
          per_seat_fee?: number | null
          per_sub_org_fee?: number | null
          policy_template_id?: string | null
          seat_limit?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          sub_org_limit?: number | null
          subscription_status?: string | null
          tenant_name: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          active_seats?: number | null
          active_sub_orgs?: number | null
          branding_config?: Json | null
          created_at?: string
          current_tier?: string | null
          features_enabled?: Json | null
          id?: string
          license_tier?: string | null
          monthly_fee?: number | null
          parent_org_id?: string
          per_seat_fee?: number | null
          per_sub_org_fee?: number | null
          policy_template_id?: string | null
          seat_limit?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          sub_org_limit?: number | null
          subscription_status?: string | null
          tenant_name?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_tenants_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_tenants_policy_template_id_fkey"
            columns: ["policy_template_id"]
            isOneToOne: false
            referencedRelation: "permission_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      market_cycle_analysis: {
        Row: {
          ai_recommendation: string | null
          analysis_date: string
          competitor_intensity_score: number | null
          created_at: string
          demand_velocity_score: number | null
          id: string
          macro_factors: Json | null
          market_phase: string
          organization_id: string
          phase_confidence: number | null
          pricing_compression_score: number | null
          recommended_strategy: string | null
          sentiment_score: number | null
          timing_signals: Json | null
        }
        Insert: {
          ai_recommendation?: string | null
          analysis_date: string
          competitor_intensity_score?: number | null
          created_at?: string
          demand_velocity_score?: number | null
          id?: string
          macro_factors?: Json | null
          market_phase: string
          organization_id: string
          phase_confidence?: number | null
          pricing_compression_score?: number | null
          recommended_strategy?: string | null
          sentiment_score?: number | null
          timing_signals?: Json | null
        }
        Update: {
          ai_recommendation?: string | null
          analysis_date?: string
          competitor_intensity_score?: number | null
          created_at?: string
          demand_velocity_score?: number | null
          id?: string
          macro_factors?: Json | null
          market_phase?: string
          organization_id?: string
          phase_confidence?: number | null
          pricing_compression_score?: number | null
          recommended_strategy?: string | null
          sentiment_score?: number | null
          timing_signals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "market_cycle_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      market_positions: {
        Row: {
          category_name: string
          created_at: string
          current_position: string | null
          differentiation_score: number | null
          id: string
          market_narrative: string | null
          organization_id: string
          positioning_strategy: string | null
          price_anchors: Json
          target_position: string | null
          unique_mechanisms: Json
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          current_position?: string | null
          differentiation_score?: number | null
          id?: string
          market_narrative?: string | null
          organization_id: string
          positioning_strategy?: string | null
          price_anchors?: Json
          target_position?: string | null
          unique_mechanisms?: Json
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          current_position?: string | null
          differentiation_score?: number | null
          id?: string
          market_narrative?: string | null
          organization_id?: string
          positioning_strategy?: string | null
          price_anchors?: Json
          target_position?: string | null
          unique_mechanisms?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_positions_organization_id_fkey"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      memory_embeddings: {
        Row: {
          content: string
          content_type: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          content_type?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_type?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_items: {
        Row: {
          content: Json
          created_at: string
          id: string
          organization_id: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          organization_id: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          organization_id?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          body: string | null
          campaign_step_id: string | null
          channel: string
          contact_id: string | null
          created_at: string | null
          delivered_at: string | null
          direction: string
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          organization_id: string
          provider: string | null
          provider_id: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          body?: string | null
          campaign_step_id?: string | null
          channel: string
          contact_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          direction: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          organization_id: string
          provider?: string | null
          provider_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          body?: string | null
          campaign_step_id?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          organization_id?: string
          provider?: string | null
          provider_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_campaign_step_id_fkey"
            columns: ["campaign_step_id"]
            isOneToOne: false
            referencedRelation: "campaign_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          cost_tokens: number | null
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          cost_tokens?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          cost_tokens?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_campaigns: {
        Row: {
          ad_account_id: string
          created_at: string | null
          daily_budget: number | null
          end_date: string | null
          external_campaign_id: string
          id: string
          last_synced_at: string | null
          lifetime_budget: number | null
          name: string
          objective: string | null
          organization_id: string
          settings: Json | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ad_account_id: string
          created_at?: string | null
          daily_budget?: number | null
          end_date?: string | null
          external_campaign_id: string
          id?: string
          last_synced_at?: string | null
          lifetime_budget?: number | null
          name: string
          objective?: string | null
          organization_id: string
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ad_account_id?: string
          created_at?: string | null
          daily_budget?: number | null
          end_date?: string | null
          external_campaign_id?: string
          id?: string
          last_synced_at?: string | null
          lifetime_budget?: number | null
          name?: string
          objective?: string | null
          organization_id?: string
          settings?: Json | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_campaigns_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          category: string
          id: string
          metadata: Json | null
          name: string
          organization_id: string
          recorded_at: string
          value: number
        }
        Insert: {
          category: string
          id?: string
          metadata?: Json | null
          name: string
          organization_id: string
          recorded_at?: string
          value: number
        }
        Update: {
          category?: string
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string
          recorded_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          drip_delay_days: number | null
          id: string
          is_locked: boolean | null
          position: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          drip_delay_days?: number | null
          id?: string
          is_locked?: boolean | null
          position: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          drip_delay_days?: number | null
          id?: string
          is_locked?: boolean | null
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      news_signals: {
        Row: {
          company_name: string
          created_at: string
          detected_at: string
          draft_email: string | null
          headline: string
          id: string
          organization_id: string | null
          outreach_status: string | null
          processed_at: string | null
          relevance_score: number | null
          signal_type: string
          source_url: string | null
          summary: string | null
          variant_id: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          detected_at?: string
          draft_email?: string | null
          headline: string
          id?: string
          organization_id?: string | null
          outreach_status?: string | null
          processed_at?: string | null
          relevance_score?: number | null
          signal_type: string
          source_url?: string | null
          summary?: string | null
          variant_id?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          detected_at?: string
          draft_email?: string | null
          headline?: string
          id?: string
          organization_id?: string | null
          outreach_status?: string | null
          processed_at?: string | null
          relevance_score?: number | null
          signal_type?: string
          source_url?: string | null
          summary?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_signals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_signals_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "prompt_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      no_show_tracking: {
        Row: {
          booking_id: string
          contact_id: string | null
          created_at: string | null
          id: string
          no_show_count: number | null
          no_show_reason_likelihood: Json | null
          organization_id: string
          pre_call_engagement_score: number | null
          recovered: boolean | null
          recovery_attempts: Json | null
          recovery_track: string | null
          rescheduled_booking_id: string | null
          time_between_book_and_noshow: number | null
        }
        Insert: {
          booking_id: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          no_show_count?: number | null
          no_show_reason_likelihood?: Json | null
          organization_id: string
          pre_call_engagement_score?: number | null
          recovered?: boolean | null
          recovery_attempts?: Json | null
          recovery_track?: string | null
          rescheduled_booking_id?: string | null
          time_between_book_and_noshow?: number | null
        }
        Update: {
          booking_id?: string
          contact_id?: string | null
          created_at?: string | null
          id?: string
          no_show_count?: number | null
          no_show_reason_likelihood?: Json | null
          organization_id?: string
          pre_call_engagement_score?: number | null
          recovered?: boolean | null
          recovery_attempts?: Json | null
          recovery_track?: string | null
          rescheduled_booking_id?: string | null
          time_between_book_and_noshow?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "no_show_tracking_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "no_show_tracking_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "no_show_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          access_token_encrypted: string
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string
          provider: string
          refresh_token_encrypted: string | null
          scopes: string[] | null
          token_type: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id: string
          provider: string
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          token_type?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          provider?: string
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          token_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      objection_handlers: {
        Row: {
          conversion_count: number | null
          created_at: string | null
          handler_text: string
          id: string
          industry_type: string
          is_master: boolean | null
          objection_pattern: string
          org_count: number | null
          usage_count: number | null
        }
        Insert: {
          conversion_count?: number | null
          created_at?: string | null
          handler_text: string
          id?: string
          industry_type: string
          is_master?: boolean | null
          objection_pattern: string
          org_count?: number | null
          usage_count?: number | null
        }
        Update: {
          conversion_count?: number | null
          created_at?: string | null
          handler_text?: string
          id?: string
          industry_type?: string
          is_master?: boolean | null
          objection_pattern?: string
          org_count?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      operator_profiles: {
        Row: {
          badges: Json
          created_at: string
          decision_quality_score: number | null
          execution_credibility_score: number | null
          id: string
          last_assessment_at: string | null
          maturity_level: string
          maturity_score: number | null
          operator_grade: string | null
          organization_id: string
          profile_visibility: string | null
          public_profile_enabled: boolean | null
          revenue_percentile: number | null
          total_verified_revenue: number | null
          updated_at: string
          user_id: string
          verified_wins: Json
        }
        Insert: {
          badges?: Json
          created_at?: string
          decision_quality_score?: number | null
          execution_credibility_score?: number | null
          id?: string
          last_assessment_at?: string | null
          maturity_level?: string
          maturity_score?: number | null
          operator_grade?: string | null
          organization_id: string
          profile_visibility?: string | null
          public_profile_enabled?: boolean | null
          revenue_percentile?: number | null
          total_verified_revenue?: number | null
          updated_at?: string
          user_id: string
          verified_wins?: Json
        }
        Update: {
          badges?: Json
          created_at?: string
          decision_quality_score?: number | null
          execution_credibility_score?: number | null
          id?: string
          last_assessment_at?: string | null
          maturity_level?: string
          maturity_score?: number | null
          operator_grade?: string | null
          organization_id?: string
          profile_visibility?: string | null
          public_profile_enabled?: boolean | null
          revenue_percentile?: number | null
          total_verified_revenue?: number | null
          updated_at?: string
          user_id?: string
          verified_wins?: Json
        }
        Relationships: [
          {
            foreignKeyName: "operator_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          amount: number | null
          close_date: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          custom_fields: Json | null
          id: string
          lost_reason: string | null
          name: string
          notes: string | null
          organization_id: string
          owner_id: string | null
          pipeline_id: string | null
          probability: number | null
          stage_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          close_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          custom_fields?: Json | null
          id?: string
          lost_reason?: string | null
          name: string
          notes?: string | null
          organization_id: string
          owner_id?: string | null
          pipeline_id?: string | null
          probability?: number | null
          stage_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          close_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          custom_fields?: Json | null
          id?: string
          lost_reason?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          owner_id?: string | null
          pipeline_id?: string | null
          probability?: number | null
          stage_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_cost_log: {
        Row: {
          activity_description: string
          activity_type: string
          ai_assessment: string | null
          alternative_activity: string | null
          alternative_value: number | null
          cost_delta: number | null
          direct_cost: number | null
          hourly_value: number | null
          id: string
          logged_at: string
          opportunity_cost: number | null
          organization_id: string
          time_spent_hours: number
          was_worth_it: boolean | null
        }
        Insert: {
          activity_description: string
          activity_type: string
          ai_assessment?: string | null
          alternative_activity?: string | null
          alternative_value?: number | null
          cost_delta?: number | null
          direct_cost?: number | null
          hourly_value?: number | null
          id?: string
          logged_at?: string
          opportunity_cost?: number | null
          organization_id: string
          time_spent_hours: number
          was_worth_it?: boolean | null
        }
        Update: {
          activity_description?: string
          activity_type?: string
          ai_assessment?: string | null
          alternative_activity?: string | null
          alternative_value?: number | null
          cost_delta?: number | null
          direct_cost?: number | null
          hourly_value?: number | null
          id?: string
          logged_at?: string
          opportunity_cost?: number | null
          organization_id?: string
          time_spent_hours?: number
          was_worth_it?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_cost_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_capacity_model: {
        Row: {
          automation_opportunities: Json | null
          bottlenecks: Json | null
          created_at: string
          decision_latency_days: number | null
          execution_velocity_score: number | null
          hiring_recommendations: Json | null
          id: string
          organization_id: string
          process_improvements: Json | null
          role_overlap_issues: Json | null
          snapshot_date: string
          team_size: number | null
          total_capacity_hours: number | null
          utilization_rate: number | null
          utilized_hours: number | null
        }
        Insert: {
          automation_opportunities?: Json | null
          bottlenecks?: Json | null
          created_at?: string
          decision_latency_days?: number | null
          execution_velocity_score?: number | null
          hiring_recommendations?: Json | null
          id?: string
          organization_id: string
          process_improvements?: Json | null
          role_overlap_issues?: Json | null
          snapshot_date: string
          team_size?: number | null
          total_capacity_hours?: number | null
          utilization_rate?: number | null
          utilized_hours?: number | null
        }
        Update: {
          automation_opportunities?: Json | null
          bottlenecks?: Json | null
          created_at?: string
          decision_latency_days?: number | null
          execution_velocity_score?: number | null
          hiring_recommendations?: Json | null
          id?: string
          organization_id?: string
          process_improvements?: Json | null
          role_overlap_issues?: Json | null
          snapshot_date?: string
          team_size?: number | null
          total_capacity_hours?: number | null
          utilization_rate?: number | null
          utilized_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "org_capacity_model_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_knowledge: {
        Row: {
          content: string
          content_type: string | null
          created_at: string | null
          embedding: string | null
          extracted_entities: Json | null
          id: string
          importance_score: number | null
          is_revenue_critical: boolean | null
          last_crawled_at: string | null
          organization_id: string
          source_type: string | null
          source_url: string | null
          title: string | null
        }
        Insert: {
          content: string
          content_type?: string | null
          created_at?: string | null
          embedding?: string | null
          extracted_entities?: Json | null
          id?: string
          importance_score?: number | null
          is_revenue_critical?: boolean | null
          last_crawled_at?: string | null
          organization_id: string
          source_type?: string | null
          source_url?: string | null
          title?: string | null
        }
        Update: {
          content?: string
          content_type?: string | null
          created_at?: string | null
          embedding?: string | null
          extracted_entities?: Json | null
          id?: string
          importance_score?: number | null
          is_revenue_critical?: boolean | null
          last_crawled_at?: string | null
          organization_id?: string
          source_type?: string | null
          source_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_knowledge_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_branding: {
        Row: {
          accent_color: string | null
          background_color: string | null
          created_at: string | null
          custom_css: string | null
          custom_domain: string | null
          favicon_url: string | null
          font_family: string | null
          id: string
          logo_url: string | null
          og_image_url: string | null
          organization_id: string
          primary_color: string | null
          secondary_color: string | null
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string | null
          custom_css?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          og_image_url?: string | null
          organization_id: string
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string | null
          custom_css?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          og_image_url?: string | null
          organization_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_branding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_priority: {
        Row: {
          activated_at: string
          expires_at: string | null
          id: string
          organization_id: string
          status: string
          stripe_subscription_id: string | null
          tier_id: string
        }
        Insert: {
          activated_at?: string
          expires_at?: string | null
          id?: string
          organization_id: string
          status?: string
          stripe_subscription_id?: string | null
          tier_id: string
        }
        Update: {
          activated_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          status?: string
          stripe_subscription_id?: string | null
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_priority_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_priority_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "priority_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      os_preferences: {
        Row: {
          brief_channel: string | null
          brief_time: string | null
          created_at: string
          decision_delegation_level: string | null
          focus_areas: Json
          id: string
          notification_preferences: Json
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brief_channel?: string | null
          brief_time?: string | null
          created_at?: string
          decision_delegation_level?: string | null
          focus_areas?: Json
          id?: string
          notification_preferences?: Json
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brief_channel?: string | null
          brief_time?: string | null
          created_at?: string
          decision_delegation_level?: string | null
          focus_areas?: Json
          id?: string
          notification_preferences?: Json
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "os_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      outcome_attributions: {
        Row: {
          action_id: string | null
          attribution_weight: number | null
          attribution_window_days: number | null
          confidence_score: number | null
          created_at: string
          decision_id: string | null
          id: string
          organization_id: string
          outcome_id: string | null
          revenue_attributed: number | null
        }
        Insert: {
          action_id?: string | null
          attribution_weight?: number | null
          attribution_window_days?: number | null
          confidence_score?: number | null
          created_at?: string
          decision_id?: string | null
          id?: string
          organization_id: string
          outcome_id?: string | null
          revenue_attributed?: number | null
        }
        Update: {
          action_id?: string | null
          attribution_weight?: number | null
          attribution_window_days?: number | null
          confidence_score?: number | null
          created_at?: string
          decision_id?: string | null
          id?: string
          organization_id?: string
          outcome_id?: string | null
          revenue_attributed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "outcome_attributions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcome_attributions_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcome_attributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcome_attributions_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "decision_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      passive_mode_state: {
        Row: {
          actions_auto_executed: number | null
          alert_threshold: string | null
          created_at: string
          daily_summary: string | null
          decisions_prepared: number | null
          id: string
          is_enabled: boolean | null
          last_observation_at: string | null
          last_reset_date: string | null
          observations_today: number | null
          opportunities_queued: number | null
          organization_id: string
          risks_flagged: number | null
          updated_at: string
          user_interventions_required: number | null
        }
        Insert: {
          actions_auto_executed?: number | null
          alert_threshold?: string | null
          created_at?: string
          daily_summary?: string | null
          decisions_prepared?: number | null
          id?: string
          is_enabled?: boolean | null
          last_observation_at?: string | null
          last_reset_date?: string | null
          observations_today?: number | null
          opportunities_queued?: number | null
          organization_id: string
          risks_flagged?: number | null
          updated_at?: string
          user_interventions_required?: number | null
        }
        Update: {
          actions_auto_executed?: number | null
          alert_threshold?: string | null
          created_at?: string
          daily_summary?: string | null
          decisions_prepared?: number | null
          id?: string
          is_enabled?: boolean | null
          last_observation_at?: string | null
          last_reset_date?: string | null
          observations_today?: number | null
          opportunities_queued?: number | null
          organization_id?: string
          risks_flagged?: number | null
          updated_at?: string
          user_interventions_required?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "passive_mode_state_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      passive_observations: {
        Row: {
          action_deadline: string | null
          actioned_at: string | null
          ai_confidence: number | null
          created_at: string
          data_points: Json | null
          description: string | null
          id: string
          observation_type: string
          organization_id: string
          requires_action: boolean | null
          severity: string | null
          source_integration: string | null
          status: string | null
          suggested_actions: Json | null
          title: string
          viewed_at: string | null
        }
        Insert: {
          action_deadline?: string | null
          actioned_at?: string | null
          ai_confidence?: number | null
          created_at?: string
          data_points?: Json | null
          description?: string | null
          id?: string
          observation_type: string
          organization_id: string
          requires_action?: boolean | null
          severity?: string | null
          source_integration?: string | null
          status?: string | null
          suggested_actions?: Json | null
          title: string
          viewed_at?: string | null
        }
        Update: {
          action_deadline?: string | null
          actioned_at?: string | null
          ai_confidence?: number | null
          created_at?: string
          data_points?: Json | null
          description?: string | null
          id?: string
          observation_type?: string
          organization_id?: string
          requires_action?: boolean | null
          severity?: string | null
          source_integration?: string | null
          status?: string | null
          suggested_actions?: Json | null
          title?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passive_observations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_learnings: {
        Row: {
          confidence_level: number | null
          context_signature: Json
          counter_indicators: Json | null
          discovered_at: string
          id: string
          last_validated_at: string | null
          organization_id: string | null
          pattern_description: string
          pattern_type: string
          recommended_action: string | null
          sample_size: number | null
          success_rate: number | null
        }
        Insert: {
          confidence_level?: number | null
          context_signature?: Json
          counter_indicators?: Json | null
          discovered_at?: string
          id?: string
          last_validated_at?: string | null
          organization_id?: string | null
          pattern_description: string
          pattern_type: string
          recommended_action?: string | null
          sample_size?: number | null
          success_rate?: number | null
        }
        Update: {
          confidence_level?: number | null
          context_signature?: Json
          counter_indicators?: Json | null
          discovered_at?: string
          id?: string
          last_validated_at?: string | null
          organization_id?: string | null
          pattern_description?: string
          pattern_type?: string
          recommended_action?: string | null
          sample_size?: number | null
          success_rate?: number | null
        }
        Relationships: []
      }
      pattern_performance: {
        Row: {
          best_variant_id: string | null
          created_at: string
          dominant_pattern: string
          emails_opened: number
          emails_replied: number
          emails_sent: number
          id: string
          organization_id: string
          primary_constraint: string | null
          reply_rate: number | null
          updated_at: string
        }
        Insert: {
          best_variant_id?: string | null
          created_at?: string
          dominant_pattern: string
          emails_opened?: number
          emails_replied?: number
          emails_sent?: number
          id?: string
          organization_id: string
          primary_constraint?: string | null
          reply_rate?: number | null
          updated_at?: string
        }
        Update: {
          best_variant_id?: string | null
          created_at?: string
          dominant_pattern?: string
          emails_opened?: number
          emails_replied?: number
          emails_sent?: number
          id?: string
          organization_id?: string
          primary_constraint?: string | null
          reply_rate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pattern_performance_best_variant_id_fkey"
            columns: ["best_variant_id"]
            isOneToOne: false
            referencedRelation: "prompt_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pattern_performance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_failures: {
        Row: {
          amount_due: number | null
          created_at: string | null
          currency: string | null
          customer_email: string
          customer_id: string | null
          error_code: string | null
          error_message: string | null
          id: string
          ltv_estimate: number | null
          next_retry_at: string | null
          organization_id: string
          recovered: boolean | null
          recovery_strategy: string | null
          retry_count: number | null
        }
        Insert: {
          amount_due?: number | null
          created_at?: string | null
          currency?: string | null
          customer_email: string
          customer_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ltv_estimate?: number | null
          next_retry_at?: string | null
          organization_id: string
          recovered?: boolean | null
          recovery_strategy?: string | null
          retry_count?: number | null
        }
        Update: {
          amount_due?: number | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string
          customer_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ltv_estimate?: number | null
          next_retry_at?: string | null
          organization_id?: string
          recovered?: boolean | null
          recovery_strategy?: string | null
          retry_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_failures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          contact_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          organization_id: string
          paid_at: string | null
          payment_method: string | null
          refund_amount: number | null
          status: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          organization_id: string
          paid_at?: string | null
          payment_method?: string | null
          refund_amount?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          organization_id?: string
          paid_at?: string | null
          payment_method?: string | null
          refund_amount?: number | null
          status?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_contracts: {
        Row: {
          allowed_tools: string[] | null
          created_at: string
          id: string
          monthly_cap_ads: number | null
          monthly_cap_experiments: number | null
          monthly_cap_tool_actions: number | null
          non_negotiables: string[] | null
          organization_id: string
          risk_posture_business: string
          risk_posture_marketing: string
          risk_posture_personal: string
          runway_minimum: number
          updated_at: string
          version: number
        }
        Insert: {
          allowed_tools?: string[] | null
          created_at?: string
          id?: string
          monthly_cap_ads?: number | null
          monthly_cap_experiments?: number | null
          monthly_cap_tool_actions?: number | null
          non_negotiables?: string[] | null
          organization_id: string
          risk_posture_business?: string
          risk_posture_marketing?: string
          risk_posture_personal?: string
          runway_minimum?: number
          updated_at?: string
          version?: number
        }
        Update: {
          allowed_tools?: string[] | null
          created_at?: string
          id?: string
          monthly_cap_ads?: number | null
          monthly_cap_experiments?: number | null
          monthly_cap_tool_actions?: number | null
          non_negotiables?: string[] | null
          organization_id?: string
          risk_posture_business?: string
          risk_posture_marketing?: string
          risk_posture_personal?: string
          runway_minimum?: number
          updated_at?: string
          version?: number
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
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          pipeline_id: string
          position: number
          probability: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          pipeline_id: string
          position: number
          probability?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          pipeline_id?: string
          position?: number
          probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_templates: {
        Row: {
          category: string
          config: Json
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          niche: string | null
          popularity: number | null
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          niche?: string | null
          popularity?: number | null
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          niche?: string | null
          popularity?: number | null
        }
        Relationships: []
      }
      playbook_listings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          organization_id: string
          playbook_id: string
          preview_content: Json | null
          price: number | null
          rating: number | null
          revenue_generated: number | null
          review_count: number | null
          sales_count: number | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          organization_id: string
          playbook_id: string
          preview_content?: Json | null
          price?: number | null
          rating?: number | null
          revenue_generated?: number | null
          review_count?: number | null
          sales_count?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          organization_id?: string
          playbook_id?: string
          preview_content?: Json | null
          price?: number | null
          rating?: number | null
          revenue_generated?: number | null
          review_count?: number | null
          sales_count?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_listings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_listings_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_template: boolean | null
          last_used_at: string | null
          organization_id: string
          steps: Json
          success_metrics: string[] | null
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean | null
          last_used_at?: string | null
          organization_id: string
          steps?: Json
          success_metrics?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean | null
          last_used_at?: string | null
          organization_id?: string
          steps?: Json
          success_metrics?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          amount: number
          billing_period: string | null
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          product_id: string
          stripe_price_id: string | null
          trial_days: number | null
        }
        Insert: {
          amount: number
          billing_period?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          product_id: string
          stripe_price_id?: string | null
          trial_days?: number | null
        }
        Update: {
          amount?: number
          billing_period?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          product_id?: string
          stripe_price_id?: string | null
          trial_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_intelligence: {
        Row: {
          competitor_price: number | null
          competitor_selector: string | null
          competitor_url: string | null
          created_at: string | null
          id: string
          last_checked: string | null
          min_margin_percent: number | null
          my_cogs: number | null
          my_price: number
          organization_id: string
          price_action_taken: string | null
          product_name: string
        }
        Insert: {
          competitor_price?: number | null
          competitor_selector?: string | null
          competitor_url?: string | null
          created_at?: string | null
          id?: string
          last_checked?: string | null
          min_margin_percent?: number | null
          my_cogs?: number | null
          my_price: number
          organization_id: string
          price_action_taken?: string | null
          product_name: string
        }
        Update: {
          competitor_price?: number | null
          competitor_selector?: string | null
          competitor_url?: string | null
          created_at?: string | null
          id?: string
          last_checked?: string | null
          min_margin_percent?: number | null
          my_cogs?: number | null
          my_price?: number
          organization_id?: string
          price_action_taken?: string | null
          product_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_intelligence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      priority_tiers: {
        Row: {
          compute_multiplier: number
          created_at: string
          features: Json
          id: string
          max_simulations: number
          monthly_price: number
          red_team_enabled: boolean
          response_sla_seconds: number
          tier_level: number
          tier_name: string
        }
        Insert: {
          compute_multiplier?: number
          created_at?: string
          features?: Json
          id?: string
          max_simulations?: number
          monthly_price?: number
          red_team_enabled?: boolean
          response_sla_seconds?: number
          tier_level: number
          tier_name: string
        }
        Update: {
          compute_multiplier?: number
          created_at?: string
          features?: Json
          id?: string
          max_simulations?: number
          monthly_price?: number
          red_team_enabled?: boolean
          response_sla_seconds?: number
          tier_level?: number
          tier_name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          product_type: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          product_type?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          product_type?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
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
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_super_admin: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_super_admin?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_super_admin?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      prompt_variants: {
        Row: {
          agent_type: string
          created_at: string | null
          generation: number | null
          id: string
          is_active: boolean | null
          organization_id: string
          parent_variant_id: string | null
          prompt_text: string
          successes: number | null
          uses: number | null
          variant_tag: string
        }
        Insert: {
          agent_type: string
          created_at?: string | null
          generation?: number | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          parent_variant_id?: string | null
          prompt_text: string
          successes?: number | null
          uses?: number | null
          variant_tag: string
        }
        Update: {
          agent_type?: string
          created_at?: string | null
          generation?: number | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          parent_variant_id?: string | null
          prompt_text?: string
          successes?: number | null
          uses?: number | null
          variant_tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_variants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_variants_parent_variant_id_fkey"
            columns: ["parent_variant_id"]
            isOneToOne: false
            referencedRelation: "prompt_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          activated_at: string | null
          agent_type: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          organization_id: string | null
          performance_score: number | null
          prompt_content: string
          prompt_name: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          agent_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          organization_id?: string | null
          performance_score?: number | null
          prompt_content: string
          prompt_name: string
          version?: number
        }
        Update: {
          activated_at?: string | null
          agent_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          organization_id?: string | null
          performance_score?: number | null
          prompt_content?: string
          prompt_name?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          attempted_at: string | null
          enrollment_id: string
          id: string
          passed: boolean | null
          quiz_id: string
          score: number | null
        }
        Insert: {
          answers?: Json
          attempted_at?: string | null
          enrollment_id: string
          id?: string
          passed?: boolean | null
          quiz_id: string
          score?: number | null
        }
        Update: {
          answers?: Json
          attempted_at?: string | null
          enrollment_id?: string
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          max_attempts: number | null
          passing_score: number | null
          questions: Json
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          max_attempts?: number | null
          passing_score?: number | null
          questions?: Json
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          max_attempts?: number | null
          passing_score?: number | null
          questions?: Json
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_logs: {
        Row: {
          chat_history_summary: string | null
          contact_id: string | null
          created_at: string | null
          customer_id: string | null
          feedback_text: string | null
          id: string
          organization_id: string
          review_link: string | null
          review_platform: string | null
          sentiment_score: number | null
          status: string | null
        }
        Insert: {
          chat_history_summary?: string | null
          contact_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          feedback_text?: string | null
          id?: string
          organization_id: string
          review_link?: string | null
          review_platform?: string | null
          sentiment_score?: number | null
          status?: string | null
        }
        Update: {
          chat_history_summary?: string | null
          contact_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          feedback_text?: string | null
          id?: string
          organization_id?: string
          review_link?: string | null
          review_platform?: string | null
          sentiment_score?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_risk_alerts: {
        Row: {
          description: string
          detected_at: string
          id: string
          organization_id: string
          potential_revenue_impact: number | null
          recommended_action: string | null
          resolved_at: string | null
          risk_type: string
          severity: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          description: string
          detected_at?: string
          id?: string
          organization_id: string
          potential_revenue_impact?: number | null
          recommended_action?: string | null
          resolved_at?: string | null
          risk_type: string
          severity?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          description?: string
          detected_at?: string
          id?: string
          organization_id?: string
          potential_revenue_impact?: number | null
          recommended_action?: string | null
          resolved_at?: string | null
          risk_type?: string
          severity?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_risk_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_events: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          event_type: string
          external_transaction_id: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          organization_id: string
          payment_provider: string | null
          workflow_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type: string
          external_transaction_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          organization_id: string
          payment_provider?: string | null
          workflow_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string
          external_transaction_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          organization_id?: string
          payment_provider?: string | null
          workflow_id?: string | null
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
          {
            foreignKeyName: "revenue_events_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_governance_rules: {
        Row: {
          condition_logic: Json
          created_at: string
          enforcement_level: string
          id: string
          is_active: boolean
          organization_id: string
          rule_name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          condition_logic?: Json
          created_at?: string
          enforcement_level?: string
          id?: string
          is_active?: boolean
          organization_id: string
          rule_name: string
          rule_type?: string
          updated_at?: string
        }
        Update: {
          condition_logic?: Json
          created_at?: string
          enforcement_level?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          rule_name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_governance_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_pivots: {
        Row: {
          created_at: string | null
          cta_link: string | null
          cta_type: string | null
          id: string
          is_active: boolean | null
          librarian_response: string | null
          organization_id: string
          priority: number | null
          revenue_response: string
          trigger_category: string
          trigger_patterns: string[] | null
        }
        Insert: {
          created_at?: string | null
          cta_link?: string | null
          cta_type?: string | null
          id?: string
          is_active?: boolean | null
          librarian_response?: string | null
          organization_id: string
          priority?: number | null
          revenue_response: string
          trigger_category: string
          trigger_patterns?: string[] | null
        }
        Update: {
          created_at?: string | null
          cta_link?: string | null
          cta_type?: string | null
          id?: string
          is_active?: boolean | null
          librarian_response?: string | null
          organization_id?: string
          priority?: number | null
          revenue_response?: string
          trigger_category?: string
          trigger_patterns?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_pivots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_suppliers: {
        Row: {
          avg_delivery_time_hours: number | null
          created_at: string
          id: string
          is_active: boolean | null
          is_escrow_enabled: boolean | null
          organization_id: string
          pricing: Json | null
          quality_score: number | null
          refund_rate: number | null
          reliability_score: number | null
          services_offered: string[] | null
          sla_terms: Json | null
          successful_orders: number | null
          supplier_email: string | null
          supplier_name: string
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          avg_delivery_time_hours?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_escrow_enabled?: boolean | null
          organization_id: string
          pricing?: Json | null
          quality_score?: number | null
          refund_rate?: number | null
          reliability_score?: number | null
          services_offered?: string[] | null
          sla_terms?: Json | null
          successful_orders?: number | null
          supplier_email?: string | null
          supplier_name: string
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          avg_delivery_time_hours?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_escrow_enabled?: boolean | null
          organization_id?: string
          pricing?: Json | null
          quality_score?: number | null
          refund_rate?: number | null
          reliability_score?: number | null
          services_offered?: string[] | null
          sla_terms?: Json | null
          successful_orders?: number | null
          supplier_email?: string | null
          supplier_name?: string
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
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
      social_accounts_sync: {
        Row: {
          access_token_expires_at: string | null
          account_name: string | null
          created_at: string
          external_account_id: string | null
          followers_count: number | null
          following_count: number | null
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          organization_id: string
          platform: string
          posts_count: number | null
        }
        Insert: {
          access_token_expires_at?: string | null
          account_name?: string | null
          created_at?: string
          external_account_id?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          organization_id: string
          platform: string
          posts_count?: number | null
        }
        Update: {
          access_token_expires_at?: string | null
          account_name?: string | null
          created_at?: string
          external_account_id?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          organization_id?: string
          platform?: string
          posts_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_sync_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts_sync: {
        Row: {
          ai_performance_score: number | null
          avg_watch_time_seconds: number | null
          clicks: number | null
          comments: number | null
          content_preview: string | null
          engagement_rate: number | null
          external_post_id: string
          id: string
          impressions: number | null
          likes: number | null
          organization_id: string
          platform: string
          post_type: string | null
          published_at: string | null
          reach: number | null
          saves: number | null
          sentiment_score: number | null
          shares: number | null
          synced_at: string
          topics: string[] | null
          video_views: number | null
        }
        Insert: {
          ai_performance_score?: number | null
          avg_watch_time_seconds?: number | null
          clicks?: number | null
          comments?: number | null
          content_preview?: string | null
          engagement_rate?: number | null
          external_post_id: string
          id?: string
          impressions?: number | null
          likes?: number | null
          organization_id: string
          platform: string
          post_type?: string | null
          published_at?: string | null
          reach?: number | null
          saves?: number | null
          sentiment_score?: number | null
          shares?: number | null
          synced_at?: string
          topics?: string[] | null
          video_views?: number | null
        }
        Update: {
          ai_performance_score?: number | null
          avg_watch_time_seconds?: number | null
          clicks?: number | null
          comments?: number | null
          content_preview?: string | null
          engagement_rate?: number | null
          external_post_id?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          organization_id?: string
          platform?: string
          post_type?: string | null
          published_at?: string | null
          reach?: number | null
          saves?: number | null
          sentiment_score?: number | null
          shares?: number | null
          synced_at?: string
          topics?: string[] | null
          video_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_sync_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      status_assessments: {
        Row: {
          assessed_at: string
          assessment_period_end: string
          assessment_period_start: string
          grade_change_reason: string | null
          id: string
          metrics_evaluated: Json
          new_grade: string | null
          organization_id: string
          previous_grade: string | null
          profile_id: string | null
          recommendations: Json
        }
        Insert: {
          assessed_at?: string
          assessment_period_end: string
          assessment_period_start: string
          grade_change_reason?: string | null
          id?: string
          metrics_evaluated?: Json
          new_grade?: string | null
          organization_id: string
          previous_grade?: string | null
          profile_id?: string | null
          recommendations?: Json
        }
        Update: {
          assessed_at?: string
          assessment_period_end?: string
          assessment_period_start?: string
          grade_change_reason?: string | null
          id?: string
          metrics_evaluated?: Json
          new_grade?: string | null
          organization_id?: string
          previous_grade?: string | null
          profile_id?: string | null
          recommendations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "status_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "status_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "operator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_friction_blocks: {
        Row: {
          block_type: string
          created_at: string
          id: string
          is_active: boolean | null
          organization_id: string
          overridden_at: string | null
          overridden_by: string | null
          override_allowed: boolean | null
          override_reason: string | null
          prerequisite_status: Json | null
          prerequisites: Json | null
          reason: string
          resolved_at: string | null
          severity: string | null
          target_action: string
        }
        Insert: {
          block_type: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_allowed?: boolean | null
          override_reason?: string | null
          prerequisite_status?: Json | null
          prerequisites?: Json | null
          reason: string
          resolved_at?: string | null
          severity?: string | null
          target_action: string
        }
        Update: {
          block_type?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_allowed?: boolean | null
          override_reason?: string | null
          prerequisite_status?: Json | null
          prerequisites?: Json | null
          reason?: string
          resolved_at?: string | null
          severity?: string | null
          target_action?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_friction_blocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_governance_decisions: {
        Row: {
          created_at: string
          governance_decision: string
          governance_reasoning: string | null
          id: string
          organization_id: string
          override_by: string | null
          override_reason: string | null
          pricing_power_impact: string | null
          projected_long_term_impact: number | null
          projected_short_term_revenue: number | null
          rule_id: string | null
          strategy_description: string
          strategy_type: string
        }
        Insert: {
          created_at?: string
          governance_decision?: string
          governance_reasoning?: string | null
          id?: string
          organization_id: string
          override_by?: string | null
          override_reason?: string | null
          pricing_power_impact?: string | null
          projected_long_term_impact?: number | null
          projected_short_term_revenue?: number | null
          rule_id?: string | null
          strategy_description: string
          strategy_type: string
        }
        Update: {
          created_at?: string
          governance_decision?: string
          governance_reasoning?: string | null
          id?: string
          organization_id?: string
          override_by?: string | null
          override_reason?: string | null
          pricing_power_impact?: string | null
          projected_long_term_impact?: number | null
          projected_short_term_revenue?: number | null
          rule_id?: string | null
          strategy_description?: string
          strategy_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_governance_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_governance_decisions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "revenue_governance_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_guide: {
        Row: {
          advice: string
          confidence_score: number | null
          created_at: string
          error_pattern: string | null
          id: string
          last_applied_at: string | null
          organization_id: string | null
          task_type: string
          times_applied: number | null
          updated_at: string
        }
        Insert: {
          advice: string
          confidence_score?: number | null
          created_at?: string
          error_pattern?: string | null
          id?: string
          last_applied_at?: string | null
          organization_id?: string | null
          task_type: string
          times_applied?: number | null
          updated_at?: string
        }
        Update: {
          advice?: string
          confidence_score?: number | null
          created_at?: string
          error_pattern?: string | null
          id?: string
          last_applied_at?: string | null
          organization_id?: string | null
          task_type?: string
          times_applied?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_guide_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      style_training_samples: {
        Row: {
          content: string
          created_at: string | null
          extracted_markers: Json | null
          id: string
          organization_id: string
          processed: boolean | null
          sample_type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          extracted_markers?: Json | null
          id?: string
          organization_id: string
          processed?: boolean | null
          sample_type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          extracted_markers?: Json | null
          id?: string
          organization_id?: string
          processed?: boolean | null
          sample_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_training_samples_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      style_vectors: {
        Row: {
          closing_style: string | null
          formality_score: number | null
          greeting_style: string | null
          humor_markers: string[] | null
          id: string
          last_updated: string | null
          organization_id: string
          sample_count: number | null
          sentence_length_avg: number | null
          signature_phrases: string[] | null
          source_type: string
          style_embedding: Json | null
          tone_keywords: string[] | null
          vocabulary_preferences: Json | null
        }
        Insert: {
          closing_style?: string | null
          formality_score?: number | null
          greeting_style?: string | null
          humor_markers?: string[] | null
          id?: string
          last_updated?: string | null
          organization_id: string
          sample_count?: number | null
          sentence_length_avg?: number | null
          signature_phrases?: string[] | null
          source_type: string
          style_embedding?: Json | null
          tone_keywords?: string[] | null
          vocabulary_preferences?: Json | null
        }
        Update: {
          closing_style?: string | null
          formality_score?: number | null
          greeting_style?: string | null
          humor_markers?: string[] | null
          id?: string
          last_updated?: string | null
          organization_id?: string
          sample_count?: number | null
          sentence_length_avg?: number | null
          signature_phrases?: string[] | null
          source_type?: string
          style_embedding?: Json | null
          tone_keywords?: string[] | null
          vocabulary_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "style_vectors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancelled_at: string | null
          contact_id: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          organization_id: string
          price_id: string | null
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at?: string | null
          cancelled_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          price_id?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at?: string | null
          cancelled_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          price_id?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      success_patterns: {
        Row: {
          avg_outcome_value: number | null
          description: string
          detected_at: string
          id: string
          inputs_required: Json | null
          organization_id: string
          outputs_delivered: Json | null
          pattern_name: string
          pattern_type: string
          repeatability_score: number | null
          steps: Json
          success_metrics: Json | null
          times_executed: number | null
        }
        Insert: {
          avg_outcome_value?: number | null
          description: string
          detected_at?: string
          id?: string
          inputs_required?: Json | null
          organization_id: string
          outputs_delivered?: Json | null
          pattern_name: string
          pattern_type: string
          repeatability_score?: number | null
          steps?: Json
          success_metrics?: Json | null
          times_executed?: number | null
        }
        Update: {
          avg_outcome_value?: number | null
          description?: string
          detected_at?: string
          id?: string
          inputs_required?: Json | null
          organization_id?: string
          outputs_delivered?: Json | null
          pattern_name?: string
          pattern_type?: string
          repeatability_score?: number | null
          steps?: Json
          success_metrics?: Json | null
          times_executed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "success_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      success_tax_ledger: {
        Row: {
          gross_amount: number
          id: string
          organization_id: string
          partner_id: string | null
          partner_share: number | null
          platform_share: number
          recommendation_id: string | null
          revenue_type: string
          status: string
          transaction_date: string
        }
        Insert: {
          gross_amount: number
          id?: string
          organization_id: string
          partner_id?: string | null
          partner_share?: number | null
          platform_share: number
          recommendation_id?: string | null
          revenue_type: string
          status?: string
          transaction_date?: string
        }
        Update: {
          gross_amount?: number
          id?: string
          organization_id?: string
          partner_id?: string | null
          partner_share?: number | null
          platform_share?: number
          recommendation_id?: string | null
          revenue_type?: string
          status?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_tax_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_tax_ledger_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_tax_ledger_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_rules: {
        Row: {
          created_at: string | null
          form_id: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          rules: Json
        }
        Insert: {
          created_at?: string | null
          form_id: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          rules?: Json
        }
        Update: {
          created_at?: string | null
          form_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          rules?: Json
        }
        Relationships: [
          {
            foreignKeyName: "survey_rules_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_applications: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_applications_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      taste_preferences: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          last_observed_at: string
          observation_count: number
          organization_id: string
          pattern_key: string
          pattern_value: Json
          preference_type: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          id?: string
          last_observed_at?: string
          observation_count?: number
          organization_id: string
          pattern_key: string
          pattern_value?: Json
          preference_type: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          last_observed_at?: string
          observation_count?: number
          organization_id?: string
          pattern_key?: string
          pattern_value?: Json
          preference_type?: string
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
      template_deployments: {
        Row: {
          deployed_at: string | null
          deployed_by: string | null
          deployed_entity_id: string
          deployed_entity_type: string
          id: string
          organization_id: string
          template_id: string | null
        }
        Insert: {
          deployed_at?: string | null
          deployed_by?: string | null
          deployed_entity_id: string
          deployed_entity_type: string
          id?: string
          organization_id: string
          template_id?: string | null
        }
        Update: {
          deployed_at?: string | null
          deployed_by?: string | null
          deployed_entity_id?: string
          deployed_entity_type?: string
          id?: string
          organization_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_deployments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_deployments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "platform_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      time_analysis_daily: {
        Row: {
          admin_minutes: number | null
          ai_recommendations: Json | null
          analysis_date: string
          burnout_risk_score: number | null
          created_at: string
          deep_work_minutes: number | null
          id: string
          meeting_minutes: number | null
          meeting_roi_score: number | null
          opportunity_cost_estimate: number | null
          organization_id: string
          revenue_generating_minutes: number | null
          revenue_per_hour: number | null
          total_tracked_minutes: number | null
          user_id: string | null
        }
        Insert: {
          admin_minutes?: number | null
          ai_recommendations?: Json | null
          analysis_date: string
          burnout_risk_score?: number | null
          created_at?: string
          deep_work_minutes?: number | null
          id?: string
          meeting_minutes?: number | null
          meeting_roi_score?: number | null
          opportunity_cost_estimate?: number | null
          organization_id: string
          revenue_generating_minutes?: number | null
          revenue_per_hour?: number | null
          total_tracked_minutes?: number | null
          user_id?: string | null
        }
        Update: {
          admin_minutes?: number | null
          ai_recommendations?: Json | null
          analysis_date?: string
          burnout_risk_score?: number | null
          created_at?: string
          deep_work_minutes?: number | null
          id?: string
          meeting_minutes?: number | null
          meeting_roi_score?: number | null
          opportunity_cost_estimate?: number | null
          organization_id?: string
          revenue_generating_minutes?: number | null
          revenue_per_hour?: number | null
          total_tracked_minutes?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_analysis_daily_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      time_tracking_entries: {
        Row: {
          category: string | null
          duration_minutes: number
          end_time: string | null
          external_id: string | null
          hourly_rate: number | null
          id: string
          is_billable: boolean | null
          notes: string | null
          organization_id: string
          project_name: string | null
          source: string
          start_time: string
          synced_at: string
          task_name: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          duration_minutes: number
          end_time?: string | null
          external_id?: string | null
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          notes?: string | null
          organization_id: string
          project_name?: string | null
          source: string
          start_time: string
          synced_at?: string
          task_name?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          duration_minutes?: number
          end_time?: string | null
          external_id?: string | null
          hourly_rate?: number | null
          id?: string
          is_billable?: boolean | null
          notes?: string | null
          organization_id?: string
          project_name?: string | null
          source?: string
          start_time?: string
          synced_at?: string
          task_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_topics: {
        Row: {
          created_at: string
          discovered_at: string
          id: string
          last_used_at: string | null
          metadata: Json | null
          organization_id: string
          relevance_score: number | null
          source: string | null
          status: string
          topic: string
          used_count: number | null
        }
        Insert: {
          created_at?: string
          discovered_at?: string
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          organization_id: string
          relevance_score?: number | null
          source?: string | null
          status?: string
          topic: string
          used_count?: number | null
        }
        Update: {
          created_at?: string
          discovered_at?: string
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          organization_id?: string
          relevance_score?: number | null
          source?: string | null
          status?: string
          topic?: string
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trend_topics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_capital_ledger: {
        Row: {
          created_at: string
          cumulative_trust_score: number | null
          delivered_at: string | null
          delivery_deadline: string | null
          delivery_status: string | null
          id: string
          notes: string | null
          organization_id: string
          promise_date: string | null
          promise_made: string | null
          stakeholder_id: string | null
          stakeholder_name: string | null
          stakeholder_type: string
          trust_impact_score: number | null
        }
        Insert: {
          created_at?: string
          cumulative_trust_score?: number | null
          delivered_at?: string | null
          delivery_deadline?: string | null
          delivery_status?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          promise_date?: string | null
          promise_made?: string | null
          stakeholder_id?: string | null
          stakeholder_name?: string | null
          stakeholder_type: string
          trust_impact_score?: number | null
        }
        Update: {
          created_at?: string
          cumulative_trust_score?: number | null
          delivered_at?: string | null
          delivery_deadline?: string | null
          delivery_status?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          promise_date?: string | null
          promise_made?: string | null
          stakeholder_id?: string | null
          stakeholder_name?: string | null
          stakeholder_type?: string
          trust_impact_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_capital_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      unsubscribes: {
        Row: {
          contact_id: string | null
          email: string
          id: string
          organization_id: string
          reason: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          contact_id?: string | null
          email: string
          id?: string
          organization_id: string
          reason?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          contact_id?: string | null
          email?: string
          id?: string
          organization_id?: string
          reason?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unsubscribes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unsubscribes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      value_attribution: {
        Row: {
          action_id: string | null
          attribution_confidence: number | null
          attribution_method: string | null
          billable_value: number | null
          billed: boolean | null
          billed_at: string | null
          created_at: string | null
          decision_id: string | null
          id: string
          loss_prevented: number | null
          opportunity_captured: number | null
          organization_id: string
          revenue_influenced: number | null
          time_saved_hours: number | null
        }
        Insert: {
          action_id?: string | null
          attribution_confidence?: number | null
          attribution_method?: string | null
          billable_value?: number | null
          billed?: boolean | null
          billed_at?: string | null
          created_at?: string | null
          decision_id?: string | null
          id?: string
          loss_prevented?: number | null
          opportunity_captured?: number | null
          organization_id: string
          revenue_influenced?: number | null
          time_saved_hours?: number | null
        }
        Update: {
          action_id?: string | null
          attribution_confidence?: number | null
          attribution_method?: string | null
          billable_value?: number | null
          billed?: boolean | null
          billed_at?: string | null
          created_at?: string | null
          decision_id?: string | null
          id?: string
          loss_prevented?: number | null
          opportunity_captured?: number | null
          organization_id?: string
          revenue_influenced?: number | null
          time_saved_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "value_attribution_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "value_attribution_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "cognition_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "value_attribution_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      veto_registry: {
        Row: {
          action_blocked: string
          created_at: string
          id: string
          long_term_impact: string | null
          organization_id: string
          override_approved: boolean | null
          override_by: string | null
          override_reason: string | null
          override_requested: boolean | null
          pricing_power_protected: number | null
          reason: string
          veto_type: string
        }
        Insert: {
          action_blocked: string
          created_at?: string
          id?: string
          long_term_impact?: string | null
          organization_id: string
          override_approved?: boolean | null
          override_by?: string | null
          override_reason?: string | null
          override_requested?: boolean | null
          pricing_power_protected?: number | null
          reason: string
          veto_type: string
        }
        Update: {
          action_blocked?: string
          created_at?: string
          id?: string
          long_term_impact?: string | null
          organization_id?: string
          override_approved?: boolean | null
          override_by?: string | null
          override_reason?: string | null
          override_requested?: boolean | null
          pricing_power_protected?: number | null
          reason?: string
          veto_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "veto_registry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_call_logs: {
        Row: {
          call_outcome: string | null
          call_status: string | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          initiated_at: string | null
          lead_id: string | null
          organization_id: string
          phone_number: string | null
          recording_url: string | null
          transcript: string | null
          vapi_call_id: string | null
          variant_id: string | null
        }
        Insert: {
          call_outcome?: string | null
          call_status?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          initiated_at?: string | null
          lead_id?: string | null
          organization_id: string
          phone_number?: string | null
          recording_url?: string | null
          transcript?: string | null
          vapi_call_id?: string | null
          variant_id?: string | null
        }
        Update: {
          call_outcome?: string | null
          call_status?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          initiated_at?: string | null
          lead_id?: string | null
          organization_id?: string
          phone_number?: string | null
          recording_url?: string | null
          transcript?: string | null
          vapi_call_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_call_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_call_logs_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "prompt_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      website_analytics_daily: {
        Row: {
          analytics_date: string
          avg_session_duration_seconds: number | null
          bounce_rate: number | null
          device_breakdown: Json | null
          geo_breakdown: Json | null
          id: string
          organization_id: string
          page_views: number | null
          pages_per_session: number | null
          sessions: number | null
          source: string
          synced_at: string
          top_pages: Json | null
          top_referrers: Json | null
          unique_visitors: number | null
        }
        Insert: {
          analytics_date: string
          avg_session_duration_seconds?: number | null
          bounce_rate?: number | null
          device_breakdown?: Json | null
          geo_breakdown?: Json | null
          id?: string
          organization_id: string
          page_views?: number | null
          pages_per_session?: number | null
          sessions?: number | null
          source: string
          synced_at?: string
          top_pages?: Json | null
          top_referrers?: Json | null
          unique_visitors?: number | null
        }
        Update: {
          analytics_date?: string
          avg_session_duration_seconds?: number | null
          bounce_rate?: number | null
          device_breakdown?: Json | null
          geo_breakdown?: Json | null
          id?: string
          organization_id?: string
          page_views?: number | null
          pages_per_session?: number | null
          sessions?: number | null
          source?: string
          synced_at?: string
          top_pages?: Json | null
          top_referrers?: Json | null
          unique_visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "website_analytics_daily_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      website_diagnoses: {
        Row: {
          clarity: string | null
          confidence_score: number | null
          contact_id: string | null
          created_at: string
          credibility_type: string | null
          diagnosis_json: Json | null
          dominant_pattern: string | null
          id: string
          input_type: string
          language_style: string | null
          offer_structure: string | null
          organization_id: string
          pasted_content: string | null
          pressure_signals: string[] | null
          primary_constraint: string | null
          revenue_stage: string | null
          sales_entry: string | null
          website_url: string | null
        }
        Insert: {
          clarity?: string | null
          confidence_score?: number | null
          contact_id?: string | null
          created_at?: string
          credibility_type?: string | null
          diagnosis_json?: Json | null
          dominant_pattern?: string | null
          id?: string
          input_type?: string
          language_style?: string | null
          offer_structure?: string | null
          organization_id: string
          pasted_content?: string | null
          pressure_signals?: string[] | null
          primary_constraint?: string | null
          revenue_stage?: string | null
          sales_entry?: string | null
          website_url?: string | null
        }
        Update: {
          clarity?: string | null
          confidence_score?: number | null
          contact_id?: string | null
          created_at?: string
          credibility_type?: string | null
          diagnosis_json?: Json | null
          dominant_pattern?: string | null
          id?: string
          input_type?: string
          language_style?: string | null
          offer_structure?: string | null
          organization_id?: string
          pasted_content?: string | null
          pressure_signals?: string[] | null
          primary_constraint?: string | null
          revenue_stage?: string | null
          sales_entry?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_diagnoses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_diagnoses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_edges: {
        Row: {
          condition: Json | null
          created_at: string
          edge_type: string | null
          id: string
          organization_id: string
          source_node_id: string
          target_node_id: string
          workflow_id: string
        }
        Insert: {
          condition?: Json | null
          created_at?: string
          edge_type?: string | null
          id?: string
          organization_id: string
          source_node_id: string
          target_node_id: string
          workflow_id: string
        }
        Update: {
          condition?: Json | null
          created_at?: string
          edge_type?: string | null
          id?: string
          organization_id?: string
          source_node_id?: string
          target_node_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_edges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_edges_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_execution_steps: {
        Row: {
          action_config: Json | null
          action_type: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          execution_id: string
          id: string
          output_data: Json | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
          step_order: number
          wait_reason: string | null
          wait_until: string | null
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_id: string
          id?: string
          output_data?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          step_order: number
          wait_reason?: string | null
          wait_until?: string | null
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_id?: string
          id?: string
          output_data?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
          step_order?: number
          wait_reason?: string | null
          wait_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_steps_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          organization_id: string
          result: Json | null
          started_at: string | null
          status: string | null
          steps_executed: Json | null
          trigger_data: Json | null
          trigger_event: string
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          organization_id: string
          result?: Json | null
          started_at?: string | null
          status?: string | null
          steps_executed?: Json | null
          trigger_data?: Json | null
          trigger_event: string
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string
          result?: Json | null
          started_at?: string | null
          status?: string | null
          steps_executed?: Json | null
          trigger_data?: Json | null
          trigger_event?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_nodes: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          node_name: string
          node_type: string
          organization_id: string
          position_x: number | null
          position_y: number | null
          updated_at: string
          workflow_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          node_name: string
          node_type: string
          organization_id: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
          workflow_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          node_name?: string
          node_type?: string
          organization_id?: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_nodes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_nodes_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          actions: Json
          category: string
          created_at: string | null
          decisioning_config: Json | null
          description: string | null
          eligibility_gate: Json | null
          governance_config: Json | null
          id: string
          is_core_template: boolean | null
          learning_signals: string[] | null
          name: string
          priority: number | null
          stop_rules: Json | null
          template_id: string
          template_variables: Json | null
          trigger_event: string
          version: number | null
        }
        Insert: {
          actions?: Json
          category: string
          created_at?: string | null
          decisioning_config?: Json | null
          description?: string | null
          eligibility_gate?: Json | null
          governance_config?: Json | null
          id?: string
          is_core_template?: boolean | null
          learning_signals?: string[] | null
          name: string
          priority?: number | null
          stop_rules?: Json | null
          template_id: string
          template_variables?: Json | null
          trigger_event: string
          version?: number | null
        }
        Update: {
          actions?: Json
          category?: string
          created_at?: string | null
          decisioning_config?: Json | null
          description?: string | null
          eligibility_gate?: Json | null
          governance_config?: Json | null
          id?: string
          is_core_template?: boolean | null
          learning_signals?: string[] | null
          name?: string
          priority?: number | null
          stop_rules?: Json | null
          template_id?: string
          template_variables?: Json | null
          trigger_event?: string
          version?: number | null
        }
        Relationships: []
      }
      world_model_snapshots: {
        Row: {
          business_state: Json | null
          capital_state: Json | null
          client_state: Json | null
          created_at: string | null
          entity_graph: Json | null
          founder_state: Json | null
          health_score: number | null
          id: string
          market_state: Json | null
          organization_id: string
          risk_state: Json | null
          snapshot_date: string
        }
        Insert: {
          business_state?: Json | null
          capital_state?: Json | null
          client_state?: Json | null
          created_at?: string | null
          entity_graph?: Json | null
          founder_state?: Json | null
          health_score?: number | null
          id?: string
          market_state?: Json | null
          organization_id: string
          risk_state?: Json | null
          snapshot_date?: string
        }
        Update: {
          business_state?: Json | null
          capital_state?: Json | null
          client_state?: Json | null
          created_at?: string | null
          entity_graph?: Json | null
          founder_state?: Json | null
          health_score?: number | null
          id?: string
          market_state?: Json | null
          organization_id?: string
          risk_state?: Json | null
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_model_snapshots_organization_id_fkey"
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
      calculate_founder_substitution_index: {
        Args: { org_id: string }
        Returns: number
      }
      calculate_lead_quality_score: {
        Args: { lead_row: Database["public"]["Tables"]["leads"]["Row"] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_variant_success: {
        Args: { p_variant_id: string }
        Returns: undefined
      }
      increment_variant_uses: {
        Args: { p_variant_id: string }
        Returns: undefined
      }
      match_org_knowledge: {
        Args: {
          match_count?: number
          match_organization_id: string
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          extracted_entities: Json
          id: string
          importance_score: number
          is_revenue_critical: boolean
          similarity: number
          source_url: string
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "member" | "owner"
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
      app_role: ["admin", "member", "owner"],
    },
  },
} as const
