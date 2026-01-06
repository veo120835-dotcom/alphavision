-- Create competitive_signals table for tracking competitor intelligence
CREATE TABLE IF NOT EXISTS public.competitive_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  competitor_name TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  source TEXT,
  details JSONB DEFAULT '{}',
  response_required BOOLEAN DEFAULT false,
  response_action TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.competitive_signals ENABLE ROW LEVEL SECURITY;

-- RLS policies (use IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'competitive_signals' AND policyname = 'Users can view their org competitive signals') THEN
    CREATE POLICY "Users can view their org competitive signals"
      ON public.competitive_signals FOR SELECT
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'competitive_signals' AND policyname = 'Users can insert competitive signals for their org') THEN
    CREATE POLICY "Users can insert competitive signals for their org"
      ON public.competitive_signals FOR INSERT
      WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'competitive_signals' AND policyname = 'Users can update their org competitive signals') THEN
    CREATE POLICY "Users can update their org competitive signals"
      ON public.competitive_signals FOR UPDATE
      USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- Add decision_cooling_off tracking
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS cooling_off_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS blocked_by_agent TEXT;
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS block_reason TEXT;

-- Update passive_mode_state with action counters
ALTER TABLE public.passive_mode_state ADD COLUMN IF NOT EXISTS observations_today INTEGER DEFAULT 0;
ALTER TABLE public.passive_mode_state ADD COLUMN IF NOT EXISTS decisions_prepared INTEGER DEFAULT 0;
ALTER TABLE public.passive_mode_state ADD COLUMN IF NOT EXISTS risks_flagged INTEGER DEFAULT 0;
ALTER TABLE public.passive_mode_state ADD COLUMN IF NOT EXISTS opportunities_queued INTEGER DEFAULT 0;
ALTER TABLE public.passive_mode_state ADD COLUMN IF NOT EXISTS actions_auto_executed INTEGER DEFAULT 0;
ALTER TABLE public.passive_mode_state ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Create function to reset daily counters
CREATE OR REPLACE FUNCTION reset_passive_mode_daily_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_reset_date IS DISTINCT FROM CURRENT_DATE THEN
    NEW.observations_today := 0;
    NEW.decisions_prepared := 0;
    NEW.risks_flagged := 0;
    NEW.opportunities_queued := 0;
    NEW.actions_auto_executed := 0;
    NEW.last_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for daily counter reset
DROP TRIGGER IF EXISTS trigger_reset_passive_mode_counters ON public.passive_mode_state;
CREATE TRIGGER trigger_reset_passive_mode_counters
  BEFORE UPDATE ON public.passive_mode_state
  FOR EACH ROW EXECUTE FUNCTION reset_passive_mode_daily_counters();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitive_signals_org ON public.competitive_signals(organization_id);
CREATE INDEX IF NOT EXISTS idx_competitive_signals_detected ON public.competitive_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitive_signals_severity ON public.competitive_signals(severity);
CREATE INDEX IF NOT EXISTS idx_decisions_cooling_off ON public.decisions(cooling_off_until) WHERE cooling_off_until IS NOT NULL;