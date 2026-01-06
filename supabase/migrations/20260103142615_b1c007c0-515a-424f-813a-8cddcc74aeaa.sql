-- Enable realtime for dm_conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_conversations;

-- Enable realtime for revenue_events table
ALTER PUBLICATION supabase_realtime ADD TABLE public.revenue_events;