-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for prompt scope
CREATE TYPE public.prompt_scope AS ENUM ('global', 'domain', 'client');

-- Create enum for prompt status
CREATE TYPE public.prompt_status AS ENUM ('draft', 'active', 'deprecated', 'champion', 'challenger');

-- Create enum for memory type
CREATE TYPE public.memory_type AS ENUM ('episodic', 'semantic');

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  offer_type TEXT,
  website TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompt_templates table
CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  scope prompt_scope NOT NULL DEFAULT 'global',
  name TEXT NOT NULL,
  description TEXT,
  intent_tags TEXT[] DEFAULT '{}',
  template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  constraints JSONB DEFAULT '{}',
  output_schema JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  status prompt_status NOT NULL DEFAULT 'draft',
  parent_version_id UUID REFERENCES public.prompt_templates(id),
  performance_score DECIMAL(5,4) DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompt_runs table (telemetry)
CREATE TABLE public.prompt_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  prompt_template_id UUID REFERENCES public.prompt_templates(id) ON DELETE SET NULL,
  template_version INTEGER,
  inputs JSONB DEFAULT '{}',
  output TEXT,
  metrics JSONB DEFAULT '{}',
  human_rating INTEGER CHECK (human_rating >= 1 AND human_rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_profiles table
CREATE TABLE public.client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE NOT NULL,
  voice_preferences JSONB DEFAULT '{}',
  risk_level TEXT DEFAULT 'medium',
  preferred_structure TEXT DEFAULT 'concise',
  buyer_psychology JSONB DEFAULT '{}',
  do_not_say TEXT[] DEFAULT '{}',
  winning_patterns JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_memory table
CREATE TABLE public.client_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  memory_type memory_type NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_memory_updated_at
  BEFORE UPDATE ON public.client_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for clients (authenticated users can read, admins can write)
CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for prompt_templates
CREATE POLICY "Authenticated users can view active prompts"
  ON public.prompt_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and moderators can manage prompts"
  ON public.prompt_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- RLS Policies for prompt_runs
CREATE POLICY "Authenticated users can view runs"
  ON public.prompt_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create runs"
  ON public.prompt_runs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for client_profiles
CREATE POLICY "Authenticated users can view profiles"
  ON public.client_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage client profiles"
  ON public.client_profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for client_memory
CREATE POLICY "Authenticated users can view memory"
  ON public.client_memory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage memory"
  ON public.client_memory FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_prompt_templates_client ON public.prompt_templates(client_id);
CREATE INDEX idx_prompt_templates_scope ON public.prompt_templates(scope);
CREATE INDEX idx_prompt_templates_status ON public.prompt_templates(status);
CREATE INDEX idx_prompt_templates_intent ON public.prompt_templates USING GIN(intent_tags);
CREATE INDEX idx_prompt_runs_client ON public.prompt_runs(client_id);
CREATE INDEX idx_prompt_runs_template ON public.prompt_runs(prompt_template_id);
CREATE INDEX idx_client_memory_client ON public.client_memory(client_id);
CREATE INDEX idx_client_memory_type ON public.client_memory(memory_type);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);