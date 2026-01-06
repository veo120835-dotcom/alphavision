-- Create autonomous_agent_config table for per-organization agent settings
CREATE TABLE IF NOT EXISTS public.autonomous_agent_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  risk_tolerance TEXT DEFAULT 'balanced' CHECK (risk_tolerance IN ('conservative', 'balanced', 'aggressive')),
  auto_execute_threshold INTEGER DEFAULT 70,
  requires_approval_above DECIMAL DEFAULT 1000,
  max_daily_actions INTEGER DEFAULT 50,
  last_run TIMESTAMP WITH TIME ZONE,
  total_actions_taken INTEGER DEFAULT 0,
  total_value_generated DECIMAL DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, agent_type)
);

-- Create autonomous_actions table to log all autonomous decisions
CREATE TABLE IF NOT EXISTS public.autonomous_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_entity_type TEXT,
  target_entity_id UUID,
  decision TEXT NOT NULL,
  reasoning TEXT,
  confidence_score INTEGER,
  value_impact DECIMAL,
  was_auto_executed BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  executed_at TIMESTAMP WITH TIME ZONE,
  execution_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.autonomous_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for autonomous_agent_config
CREATE POLICY "Users can view their org agent config"
  ON public.autonomous_agent_config
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org agent config"
  ON public.autonomous_agent_config
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their org agent config"
  ON public.autonomous_agent_config
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- RLS policies for autonomous_actions
CREATE POLICY "Users can view their org autonomous actions"
  ON public.autonomous_actions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert autonomous actions"
  ON public.autonomous_actions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their org autonomous actions"
  ON public.autonomous_actions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Create function to calculate lead quality score
CREATE OR REPLACE FUNCTION public.calculate_lead_quality_score(lead_row leads)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 50;
BEGIN
  -- Base score adjustments
  IF lead_row.intent_score IS NOT NULL THEN
    score := lead_row.intent_score;
  END IF;
  
  -- Boost for email presence
  IF lead_row.email IS NOT NULL AND lead_row.email != '' THEN
    score := score + 10;
  END IF;
  
  -- Boost for phone presence
  IF lead_row.phone IS NOT NULL AND lead_row.phone != '' THEN
    score := score + 10;
  END IF;
  
  -- Boost for company info
  IF lead_row.company IS NOT NULL AND lead_row.company != '' THEN
    score := score + 5;
  END IF;
  
  -- Cap at 100
  IF score > 100 THEN
    score := 100;
  END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- Create trigger to auto-score new leads
CREATE OR REPLACE FUNCTION public.auto_score_lead_trigger()
RETURNS TRIGGER AS $$
DECLARE
  quality_threshold INTEGER;
  org_config RECORD;
BEGIN
  -- Calculate quality score
  NEW.intent_score := public.calculate_lead_quality_score(NEW);
  
  -- Check if we should auto-reject
  SELECT * INTO org_config FROM public.autonomous_agent_config 
  WHERE organization_id = NEW.organization_id 
  AND agent_type = 'client_filter' 
  AND enabled = true;
  
  IF FOUND THEN
    quality_threshold := COALESCE((org_config.config->>'quality_threshold')::INTEGER, 30);
    
    IF NEW.intent_score < quality_threshold THEN
      NEW.status := 'rejected';
      
      -- Log the autonomous action
      INSERT INTO public.autonomous_actions (
        organization_id, agent_type, action_type, target_entity_type, target_entity_id,
        decision, reasoning, confidence_score, was_auto_executed, executed_at
      ) VALUES (
        NEW.organization_id, 'client_filter', 'auto_reject', 'lead', NEW.id,
        'rejected', 'Lead quality score below threshold: ' || NEW.intent_score || ' < ' || quality_threshold,
        NEW.intent_score, true, now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on leads table
DROP TRIGGER IF EXISTS trigger_auto_score_lead ON public.leads;
CREATE TRIGGER trigger_auto_score_lead
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.auto_score_lead_trigger();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_autonomous_agent_config_org ON public.autonomous_agent_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_org ON public.autonomous_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_agent ON public.autonomous_actions(agent_type);
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_created ON public.autonomous_actions(created_at DESC);

-- Add trigger for updated_at on autonomous_agent_config
CREATE TRIGGER update_autonomous_agent_config_updated_at
  BEFORE UPDATE ON public.autonomous_agent_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();