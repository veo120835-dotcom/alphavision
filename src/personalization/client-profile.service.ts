import { supabase } from '@/integrations/supabase/client';
import type { ClientProfile, VoicePreferences, WinningPattern } from '@/prompt-studio/types';

export interface CreateClientProfileInput {
  client_id: string;
  voice_preferences?: VoicePreferences;
  risk_level?: 'low' | 'medium' | 'high';
  preferred_structure?: 'bullets' | 'concise' | 'narrative' | 'detailed';
  buyer_psychology?: Record<string, unknown>;
  do_not_say?: string[];
  notes?: string;
}

export interface UpdateClientProfileInput {
  voice_preferences?: VoicePreferences;
  risk_level?: 'low' | 'medium' | 'high';
  preferred_structure?: 'bullets' | 'concise' | 'narrative' | 'detailed';
  buyer_psychology?: Record<string, unknown>;
  do_not_say?: string[];
  winning_patterns?: WinningPattern[];
  notes?: string;
}

export class ClientProfileService {
  async createProfile(input: CreateClientProfileInput): Promise<ClientProfile> {
    const { data, error } = await supabase
      .from('client_profiles')
      .insert({
        client_id: input.client_id,
        voice_preferences: input.voice_preferences || {},
        risk_level: input.risk_level || 'medium',
        preferred_structure: input.preferred_structure || 'concise',
        buyer_psychology: input.buyer_psychology || {},
        do_not_say: input.do_not_say || [],
        notes: input.notes,
        winning_patterns: [],
      } as any)
      .select()
      .single();

    if (error) throw error;
    return this.mapToClientProfile(data);
  }

  async getProfile(clientId: string): Promise<ClientProfile | null> {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapToClientProfile(data);
  }

  async getOrCreateProfile(clientId: string): Promise<ClientProfile> {
    const existing = await this.getProfile(clientId);
    if (existing) return existing;

    return this.createProfile({ client_id: clientId });
  }

  async updateProfile(clientId: string, input: UpdateClientProfileInput): Promise<ClientProfile> {
    const updateData: Record<string, unknown> = {};

    if (input.voice_preferences !== undefined) updateData.voice_preferences = input.voice_preferences;
    if (input.risk_level !== undefined) updateData.risk_level = input.risk_level;
    if (input.preferred_structure !== undefined) updateData.preferred_structure = input.preferred_structure;
    if (input.buyer_psychology !== undefined) updateData.buyer_psychology = input.buyer_psychology;
    if (input.do_not_say !== undefined) updateData.do_not_say = input.do_not_say;
    if (input.winning_patterns !== undefined) updateData.winning_patterns = input.winning_patterns;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const { data, error } = await supabase
      .from('client_profiles')
      .update(updateData)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToClientProfile(data);
  }

  async deleteProfile(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('client_profiles')
      .delete()
      .eq('client_id', clientId);

    if (error) throw error;
  }

  async addWinningPattern(clientId: string, pattern: Omit<WinningPattern, 'discovered_at'>): Promise<ClientProfile> {
    const profile = await this.getOrCreateProfile(clientId);
    const patterns = [...(profile.winning_patterns || [])];

    // Check if pattern already exists
    const existingIndex = patterns.findIndex(p => p.pattern === pattern.pattern && p.intent === pattern.intent);

    if (existingIndex >= 0) {
      // Update existing pattern
      patterns[existingIndex] = {
        ...patterns[existingIndex],
        success_rate: pattern.success_rate,
        sample_count: patterns[existingIndex].sample_count + pattern.sample_count,
      };
    } else {
      // Add new pattern
      patterns.push({
        ...pattern,
        discovered_at: new Date().toISOString(),
      });
    }

    return this.updateProfile(clientId, { winning_patterns: patterns });
  }

  async addDoNotSayPhrase(clientId: string, phrase: string): Promise<ClientProfile> {
    const profile = await this.getOrCreateProfile(clientId);
    const phrases = [...(profile.do_not_say || [])];

    if (!phrases.includes(phrase)) {
      phrases.push(phrase);
    }

    return this.updateProfile(clientId, { do_not_say: phrases });
  }

  async removeDoNotSayPhrase(clientId: string, phrase: string): Promise<ClientProfile> {
    const profile = await this.getOrCreateProfile(clientId);
    const phrases = (profile.do_not_say || []).filter(p => p !== phrase);

    return this.updateProfile(clientId, { do_not_say: phrases });
  }

  async setVoicePreferences(clientId: string, preferences: VoicePreferences): Promise<ClientProfile> {
    return this.updateProfile(clientId, { voice_preferences: preferences });
  }

  async getAllProfiles(): Promise<ClientProfile[]> {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToClientProfile);
  }

  private mapToClientProfile(data: Record<string, unknown>): ClientProfile {
    return {
      id: data.id as string,
      client_id: data.client_id as string,
      voice_preferences: (data.voice_preferences as VoicePreferences) || {},
      risk_level: (data.risk_level as ClientProfile['risk_level']) || 'medium',
      preferred_structure: (data.preferred_structure as ClientProfile['preferred_structure']) || 'concise',
      buyer_psychology: (data.buyer_psychology as Record<string, unknown>) || {},
      do_not_say: (data.do_not_say as string[]) || [],
      winning_patterns: (data.winning_patterns as WinningPattern[]) || [],
      notes: data.notes as string | undefined,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  }
}

export const clientProfileService = new ClientProfileService();
