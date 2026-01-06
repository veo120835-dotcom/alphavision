-- Enable realtime for agent_states table
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_states;

-- Enable realtime for approval_requests table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_requests;

-- Enable realtime for content_queue table
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_queue;