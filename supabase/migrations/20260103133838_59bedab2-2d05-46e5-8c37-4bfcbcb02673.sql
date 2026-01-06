-- Enable realtime for agent execution logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_execution_logs;

-- Enable realtime for trend topics
ALTER PUBLICATION supabase_realtime ADD TABLE public.trend_topics;