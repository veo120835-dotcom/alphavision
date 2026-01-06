import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FounderState {
  energy: number;
  confidence: number;
  clarity: number;
  patterns: string[];
}

interface UseChatOptions {
  mode: 'advisor' | 'operator' | 'autopilot';
}

export function useChat({ mode }: UseChatOptions) {
  const { user } = useAuth();
  const { organization, permissionContract } = useOrganization();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [founderState, setFounderState] = useState<FounderState | null>(null);
  const [businessIdentity, setBusinessIdentity] = useState<any[]>([]);
  const [tastePatterns, setTastePatterns] = useState<any[]>([]);

  // Load context data when organization changes
  useEffect(() => {
    if (organization?.id && user?.id) {
      loadContextData();
    }
  }, [organization?.id, user?.id]);

  const loadContextData = async () => {
    if (!organization?.id || !user?.id) return;

    try {
      // Load latest founder state
      const { data: stateData } = await supabase
        .from('founder_state_logs')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (stateData) {
        setFounderState({
          energy: stateData.energy_level || 3,
          confidence: stateData.confidence_level || 3,
          clarity: stateData.decision_clarity || 3,
          patterns: stateData.detected_patterns || [],
        });
      }

      // Load business identity
      const { data: identityData } = await supabase
        .from('business_identity')
        .select('*')
        .eq('organization_id', organization.id);

      if (identityData) {
        setBusinessIdentity(identityData);
      }

      // Load taste patterns
      const { data: tasteData } = await supabase
        .from('taste_preferences')
        .select('*')
        .eq('organization_id', organization.id)
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (tasteData) {
        setTastePatterns(tasteData);
      }
    } catch (error) {
      console.error('Error loading context data:', error);
    }
  };

  const createSession = async () => {
    if (!user || !organization) return null;

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        organization_id: organization.id,
        title: 'New Chat',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    setSessionId(data.id);
    return data.id;
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await createSession();
      if (!currentSessionId) return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to database
    if (currentSessionId) {
      await supabase.from('messages').insert({
        session_id: currentSessionId,
        role: 'user',
        content,
      });
    }

    try {
      let chatMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Use Context Summarizer if conversation is getting long (>10 messages)
      if (chatMessages.length > 10) {
        try {
          const summarizerResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/context-summarizer`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                messages: chatMessages,
                maxTokensTarget: 8000,
                keepRecentCount: 6,
                includeSystemPrompt: false,
              }),
            }
          );
          
          if (summarizerResponse.ok) {
            const summaryData = await summarizerResponse.json();
            chatMessages = summaryData.optimizedMessages;
            console.log(`Context optimized: ${summaryData.stats.reductionPercent}% reduction`);
          }
        } catch (summaryError) {
          console.warn('Context summarization failed, using full history:', summaryError);
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: chatMessages,
            permissionContract,
            mode,
            founderState,
            businessIdentity,
            tastePatterns,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      if (reader) {
        let textBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages(prev => prev.map(m => 
                  m.id === assistantId 
                    ? { ...m, content: assistantContent }
                    : m
                ));
              }
            } catch {
              // Continue on parse errors
            }
          }
        }
      }

      // Save assistant message to database
      if (currentSessionId && assistantContent) {
        await supabase.from('messages').insert({
          session_id: currentSessionId,
          role: 'assistant',
          content: assistantContent,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId, isLoading, mode, permissionContract, founderState, businessIdentity, tastePatterns]);

  const clearMessages = () => {
    setMessages([]);
    setSessionId(null);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    refreshContext: loadContextData,
  };
}
