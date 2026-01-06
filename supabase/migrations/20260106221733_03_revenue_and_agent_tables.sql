/*
  # Revenue and Agent Tables Setup

  1. Revenue Tables
    - `invoices` - Invoice records
    - `revenue_events` - Revenue tracking events
    - `decision_credits` - Credit balance per org
    - `credit_transactions` - Credit transaction log

  2. Agent Tables
    - `sessions` - User sessions
    - `decisions` - AI decisions
    - `decision_outcomes` - Decision results
    - `agent_states` - Agent status tracking
    - `execution_tasks` - Task queue
    - `agent_execution_logs` - Execution audit log

  3. Security
    - Enable RLS on all tables
    - Add policies for organization members
*/

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  invoice_number TEXT,
  status TEXT DEFAULT 'draft',
  currency TEXT DEFAULT 'USD',
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  external_id TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue Events
CREATE TABLE IF NOT EXISTS public.revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id),
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  source TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Decision Credits
CREATE TABLE IF NOT EXISTS public.decision_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- Credit Transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  credit_account_id UUID REFERENCES public.decision_credits(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Decisions
CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id),
  organization_id UUID REFERENCES public.organizations(id),
  recommendation TEXT,
  status TEXT DEFAULT 'pending',
  decision_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Decision Outcomes
CREATE TABLE IF NOT EXISTS public.decision_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES public.decisions(id),
  organization_id UUID REFERENCES public.organizations(id),
  outcome_type TEXT,
  impact_score INTEGER,
  measured_value NUMERIC,
  actual_value NUMERIC,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent States
CREATE TABLE IF NOT EXISTS public.agent_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  agent_type TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  status TEXT DEFAULT 'idle',
  current_task TEXT,
  last_action TEXT,
  last_action_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Execution Tasks
CREATE TABLE IF NOT EXISTS public.execution_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  task_type TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  priority INTEGER DEFAULT 5,
  input_data JSONB DEFAULT '{}',
  output_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  workflow_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent Execution Logs
CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  action_type TEXT NOT NULL,
  reasoning TEXT,
  result TEXT,
  action_details JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- Service role policies
DROP POLICY IF EXISTS "Service role full access to invoices" ON public.invoices;
CREATE POLICY "Service role full access to invoices"
  ON public.invoices FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to revenue_events" ON public.revenue_events;
CREATE POLICY "Service role full access to revenue_events"
  ON public.revenue_events FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to credits" ON public.decision_credits;
CREATE POLICY "Service role full access to credits"
  ON public.decision_credits FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- User policies
DROP POLICY IF EXISTS "Users can view invoices in their organizations" ON public.invoices;
CREATE POLICY "Users can view invoices in their organizations"
  ON public.invoices FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view sessions in their organizations" ON public.sessions;
CREATE POLICY "Users can view sessions in their organizations"
  ON public.sessions FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view decisions in their organizations" ON public.decisions;
CREATE POLICY "Users can view decisions in their organizations"
  ON public.decisions FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_org ON public.revenue_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_org ON public.sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_decisions_org ON public.decisions(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_states_org ON public.agent_states(organization_id);
CREATE INDEX IF NOT EXISTS idx_execution_tasks_org ON public.execution_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_execution_tasks_status ON public.execution_tasks(status);