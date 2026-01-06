-- Capital Deployment & Arbitrage System Tables

-- Capital Contracts (User Approval Contracts)
CREATE TABLE public.capital_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('lead_arbitrage', 'service_reselling', 'hybrid', 'cashflow_optimization')),
  max_capital NUMERIC NOT NULL DEFAULT 0,
  max_loss NUMERIC NOT NULL DEFAULT 0,
  allowed_categories TEXT[] DEFAULT '{}',
  time_horizon_days INTEGER DEFAULT 14,
  auto_stop_rules JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'active', 'paused', 'completed', 'terminated')),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  expires_at TIMESTAMPTZ,
  current_deployed NUMERIC DEFAULT 0,
  current_pnl NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Arbitrage Opportunities (Scanned by AI)
CREATE TABLE public.arbitrage_opportunities_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('lead_arbitrage', 'service_reselling', 'distribution', 'attention')),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  niche TEXT,
  estimated_cost NUMERIC,
  estimated_revenue NUMERIC,
  estimated_roi_percent NUMERIC,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  execution_certainty NUMERIC CHECK (execution_certainty >= 0 AND execution_certainty <= 100),
  downside_risk NUMERIC CHECK (downside_risk >= 0 AND downside_risk <= 100),
  automation_compatibility NUMERIC CHECK (automation_compatibility >= 0 AND automation_compatibility <= 100),
  simulation_results JSONB DEFAULT '{}',
  best_case NUMERIC,
  base_case NUMERIC,
  worst_case NUMERIC,
  time_to_execute_hours INTEGER,
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'analyzing', 'ready', 'approved', 'executing', 'completed', 'failed', 'rejected')),
  requires_capital NUMERIC,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  outcome JSONB
);

-- Capital Deployments (Active Deployments)
CREATE TABLE public.capital_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.capital_contracts(id),
  opportunity_id UUID REFERENCES public.arbitrage_opportunities_queue(id),
  deployment_type TEXT NOT NULL,
  capital_deployed NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  realized_pnl NUMERIC DEFAULT 0,
  unrealized_pnl NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'monitoring', 'harvesting', 'completed', 'halted', 'failed')),
  execution_steps JSONB DEFAULT '[]',
  current_step INTEGER DEFAULT 0,
  risk_metrics JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  halt_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kill Switch Events
CREATE TABLE public.kill_switch_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deployment_id UUID REFERENCES public.capital_deployments(id),
  contract_id UUID REFERENCES public.capital_contracts(id),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('roi_drop', 'spend_cap', 'quality_drop', 'risk_spike', 'manual', 'time_limit', 'loss_limit', 'external')),
  trigger_value JSONB,
  threshold_value JSONB,
  action_taken TEXT NOT NULL CHECK (action_taken IN ('pause', 'halt', 'terminate', 'alert', 'reduce')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  auto_triggered BOOLEAN DEFAULT true,
  user_override BOOLEAN DEFAULT false,
  override_reason TEXT,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Lead Buyers (Vetted Buyers for Lead Arbitrage)
CREATE TABLE public.lead_buyers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_company TEXT,
  niches TEXT[] DEFAULT '{}',
  max_cpl NUMERIC,
  min_quality_score NUMERIC,
  monthly_volume_cap INTEGER,
  current_month_volume INTEGER DEFAULT 0,
  payment_terms TEXT,
  stripe_customer_id TEXT,
  trust_score NUMERIC DEFAULT 50,
  total_leads_purchased INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  avg_lead_quality_rating NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Service Suppliers (Vetted Suppliers for Reselling)
CREATE TABLE public.service_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  supplier_email TEXT,
  services_offered TEXT[] DEFAULT '{}',
  pricing JSONB DEFAULT '{}',
  sla_terms JSONB DEFAULT '{}',
  avg_delivery_time_hours INTEGER,
  quality_score NUMERIC DEFAULT 50,
  reliability_score NUMERIC DEFAULT 50,
  total_orders INTEGER DEFAULT 0,
  successful_orders INTEGER DEFAULT 0,
  refund_rate NUMERIC DEFAULT 0,
  is_escrow_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cashflow Optimizations
CREATE TABLE public.cashflow_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  optimization_type TEXT NOT NULL CHECK (optimization_type IN ('waste_detection', 'invoice_speedup', 'collection_improvement', 'payment_timing', 'tool_elimination', 'subscription_consolidation')),
  title TEXT NOT NULL,
  description TEXT,
  current_state JSONB,
  recommended_action TEXT,
  estimated_monthly_savings NUMERIC,
  estimated_one_time_savings NUMERIC,
  confidence_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'pending_approval', 'approved', 'executing', 'completed', 'rejected', 'failed')),
  auto_executable BOOLEAN DEFAULT false,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  actual_savings NUMERIC,
  execution_notes TEXT
);

-- Deployment Audit Log
CREATE TABLE public.deployment_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deployment_id UUID REFERENCES public.capital_deployments(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  decision_reasoning TEXT,
  outcome JSONB,
  roi_impact NUMERIC,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.capital_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_opportunities_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kill_switch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashflow_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their org capital contracts" ON public.capital_contracts
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org opportunities" ON public.arbitrage_opportunities_queue
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org deployments" ON public.capital_deployments
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their org kill switch events" ON public.kill_switch_events
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org lead buyers" ON public.lead_buyers
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org suppliers" ON public.service_suppliers
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their org cashflow optimizations" ON public.cashflow_optimizations
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their org audit log" ON public.deployment_audit_log
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_capital_contracts_org ON public.capital_contracts(organization_id);
CREATE INDEX idx_capital_contracts_status ON public.capital_contracts(status);
CREATE INDEX idx_opportunities_org ON public.arbitrage_opportunities_queue(organization_id);
CREATE INDEX idx_opportunities_status ON public.arbitrage_opportunities_queue(status);
CREATE INDEX idx_deployments_org ON public.capital_deployments(organization_id);
CREATE INDEX idx_deployments_status ON public.capital_deployments(status);
CREATE INDEX idx_kill_events_org ON public.kill_switch_events(organization_id);
CREATE INDEX idx_cashflow_opt_org ON public.cashflow_optimizations(organization_id);