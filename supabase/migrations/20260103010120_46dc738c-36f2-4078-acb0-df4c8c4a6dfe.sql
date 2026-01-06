-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'member', 'owner');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create memberships table (user-org relationship)
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

-- Create permission_contracts table (Permission Contract / Policy Engine)
CREATE TABLE public.permission_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  risk_posture_personal TEXT NOT NULL DEFAULT 'conservative',
  risk_posture_business TEXT NOT NULL DEFAULT 'balanced',
  risk_posture_marketing TEXT NOT NULL DEFAULT 'balanced',
  runway_minimum INTEGER NOT NULL DEFAULT 6,
  monthly_cap_ads INTEGER DEFAULT 5000,
  monthly_cap_experiments INTEGER DEFAULT 3,
  monthly_cap_tool_actions INTEGER DEFAULT 50,
  allowed_tools TEXT[] DEFAULT '{}',
  non_negotiables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sessions table (chat sessions)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  cost_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create decisions table (structured Decision Output Schema)
CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  recommendation TEXT NOT NULL,
  why_this_wins TEXT,
  assumptions TEXT[] DEFAULT '{}',
  risks JSONB DEFAULT '[]',
  options JSONB DEFAULT '[]',
  next_actions TEXT[] DEFAULT '{}',
  metrics_to_track TEXT[] DEFAULT '{}',
  kill_criteria TEXT[] DEFAULT '{}',
  questions_needed TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create memory_items table (ICP, offers, playbooks) - without embeddings for now
CREATE TABLE public.memory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('icp', 'offer', 'playbook', 'brand', 'outcome', 'skill', 'client_score')),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create artifacts table (uploaded files, transcripts)
CREATE TABLE public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create actions table (tool actions with approval/execution tracking)
CREATE TABLE public.actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES public.decisions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  action_type TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'failed', 'rolled_back')),
  result JSONB,
  rollback_data JSONB,
  approved_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create metrics table (time series for tracking)
CREATE TABLE public.metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('sales', 'marketing', 'ops', 'finance', 'time')),
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create integrations table
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  credentials_encrypted TEXT,
  scopes TEXT[] DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for organizations (via memberships)
CREATE POLICY "Users can view organizations they belong to" ON public.organizations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = organizations.id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT WITH CHECK (true);

-- RLS Policies for memberships
CREATE POLICY "Users can view memberships for their orgs" ON public.memberships FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own memberships" ON public.memberships FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for permission_contracts
CREATE POLICY "Users can view permission contracts for their orgs" ON public.permission_contracts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = permission_contracts.organization_id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can update permission contracts for their orgs" ON public.permission_contracts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = permission_contracts.organization_id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can insert permission contracts for their orgs" ON public.permission_contracts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = permission_contracts.organization_id AND memberships.user_id = auth.uid()));

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions" ON public.sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own sessions" ON public.sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own sessions" ON public.sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own sessions" ON public.sessions FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their sessions" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = messages.session_id AND sessions.user_id = auth.uid()));
CREATE POLICY "Users can insert messages in their sessions" ON public.messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = messages.session_id AND sessions.user_id = auth.uid()));

-- RLS Policies for decisions
CREATE POLICY "Users can view decisions in their sessions" ON public.decisions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = decisions.session_id AND sessions.user_id = auth.uid()));
CREATE POLICY "Users can insert decisions in their sessions" ON public.decisions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = decisions.session_id AND sessions.user_id = auth.uid()));
CREATE POLICY "Users can update decisions in their sessions" ON public.decisions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = decisions.session_id AND sessions.user_id = auth.uid()));

-- RLS Policies for memory_items
CREATE POLICY "Users can view memory items for their orgs" ON public.memory_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = memory_items.organization_id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can insert memory items for their orgs" ON public.memory_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = memory_items.organization_id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can update memory items for their orgs" ON public.memory_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = memory_items.organization_id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can delete memory items for their orgs" ON public.memory_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = memory_items.organization_id AND memberships.user_id = auth.uid()));

-- RLS Policies for artifacts
CREATE POLICY "Users can view artifacts for their orgs" ON public.artifacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = artifacts.organization_id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can insert artifacts for their orgs" ON public.artifacts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = artifacts.organization_id AND memberships.user_id = auth.uid()));

-- RLS Policies for actions
CREATE POLICY "Users can view actions for their orgs" ON public.actions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = actions.organization_id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can insert actions for their orgs" ON public.actions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = actions.organization_id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can update actions for their orgs" ON public.actions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = actions.organization_id AND memberships.user_id = auth.uid()));

-- RLS Policies for metrics
CREATE POLICY "Users can view metrics for their orgs" ON public.metrics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = metrics.organization_id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can insert metrics for their orgs" ON public.metrics FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = metrics.organization_id AND memberships.user_id = auth.uid()));

-- RLS Policies for integrations
CREATE POLICY "Users can view integrations for their orgs" ON public.integrations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = integrations.organization_id AND memberships.user_id = auth.uid()));
CREATE POLICY "Users can manage integrations for their orgs" ON public.integrations FOR ALL
  USING (EXISTS (SELECT 1 FROM public.memberships WHERE memberships.organization_id = integrations.organization_id AND memberships.user_id = auth.uid()));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace')
  RETURNING id INTO new_org_id;
  
  INSERT INTO public.memberships (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');
  
  INSERT INTO public.permission_contracts (organization_id)
  VALUES (new_org_id);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_permission_contracts_updated_at BEFORE UPDATE ON public.permission_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memory_items_updated_at BEFORE UPDATE ON public.memory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;