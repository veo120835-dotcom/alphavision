
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'operator');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent states table
CREATE TABLE public.agent_states (
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

-- Execution tasks table
CREATE TABLE public.execution_tasks (
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

-- Agent execution logs table
CREATE TABLE public.agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  action_type TEXT NOT NULL,
  reasoning TEXT,
  result TEXT,
  action_details JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Decisions table
CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id),
  organization_id UUID REFERENCES public.organizations(id),
  recommendation TEXT,
  status TEXT DEFAULT 'pending',
  decision_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Decision outcomes table
CREATE TABLE public.decision_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES public.decisions(id),
  organization_id UUID REFERENCES public.organizations(id),
  impact_score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Taste preferences table
CREATE TABLE public.taste_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  pattern_key TEXT NOT NULL,
  observation_count INTEGER DEFAULT 1,
  confidence_score NUMERIC DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Founder state logs table
CREATE TABLE public.founder_state_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  energy_level INTEGER,
  confidence_level INTEGER,
  decision_clarity INTEGER,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT DEFAULT 'new',
  score INTEGER DEFAULT 0,
  source TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue events table
CREATE TABLE public.revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  lead_id UUID REFERENCES public.leads(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  event_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Approval requests table
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Daily priorities table (for Sovereign Priority Engine)
CREATE TABLE public.daily_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  focus_items JSONB DEFAULT '[]',
  ignore_items JSONB DEFAULT '[]',
  highest_roi_action TEXT,
  emerging_risks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Constraint hierarchy table
CREATE TABLE public.constraint_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  constraint_type TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taste_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_state_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constraint_hierarchy ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles (only admins can manage)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for sessions
CREATE POLICY "Users can manage own sessions" ON public.sessions FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for org-scoped tables
CREATE POLICY "Org members can view agent_states" ON public.agent_states FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage agent_states" ON public.agent_states FOR ALL USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view execution_tasks" ON public.execution_tasks FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage execution_tasks" ON public.execution_tasks FOR ALL USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view agent_execution_logs" ON public.agent_execution_logs FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can insert agent_execution_logs" ON public.agent_execution_logs FOR INSERT WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view decisions" ON public.decisions FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage decisions" ON public.decisions FOR ALL USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view decision_outcomes" ON public.decision_outcomes FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage decision_outcomes" ON public.decision_outcomes FOR ALL USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view taste_preferences" ON public.taste_preferences FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage taste_preferences" ON public.taste_preferences FOR ALL USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view founder_state_logs" ON public.founder_state_logs FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage founder_state_logs" ON public.founder_state_logs FOR ALL USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view leads" ON public.leads FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage leads" ON public.leads FOR ALL USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view revenue_events" ON public.revenue_events FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage revenue_events" ON public.revenue_events FOR ALL USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view approval_requests" ON public.approval_requests FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage approval_requests" ON public.approval_requests FOR ALL USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view daily_priorities" ON public.daily_priorities FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage daily_priorities" ON public.daily_priorities FOR ALL USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can view constraint_hierarchy" ON public.constraint_hierarchy FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can manage constraint_hierarchy" ON public.constraint_hierarchy FOR ALL USING (is_org_member(auth.uid(), organization_id));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.execution_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_execution_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
