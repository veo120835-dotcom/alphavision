import { memoryService } from './memory.service';
import { clientProfileService } from './client-profile.service';
import type { ClientProfile, ClientMemory, PromptRenderContext, VoicePreferences } from '@/prompt-studio/types';

export interface ContextBuilderConfig {
  includeSemanticMemory: boolean;
  includeEpisodicMemory: boolean;
  includeProfile: boolean;
  maxSemanticMemories: number;
  maxEpisodicMemories: number;
  minRelevanceScore: number;
}

const DEFAULT_CONFIG: ContextBuilderConfig = {
  includeSemanticMemory: true,
  includeEpisodicMemory: true,
  includeProfile: true,
  maxSemanticMemories: 10,
  maxEpisodicMemories: 5,
  minRelevanceScore: 0.3,
};

export interface BuiltContext {
  renderContext: PromptRenderContext;
  profile: ClientProfile | null;
  semanticMemories: ClientMemory[];
  episodicMemories: ClientMemory[];
  contextSummary: string;
}

export class ContextBuilder {
  private config: ContextBuilderConfig;

  constructor(config: Partial<ContextBuilderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Build complete context for prompt rendering
   */
  async buildContext(
    clientId: string,
    variables: Record<string, unknown> = {}
  ): Promise<BuiltContext> {
    const [profile, memories] = await Promise.all([
      this.config.includeProfile ? clientProfileService.getProfile(clientId) : null,
      this.getRelevantMemories(clientId),
    ]);

    const renderContext: PromptRenderContext = {
      variables,
      client_profile: profile || undefined,
      memories: [...memories.semantic, ...memories.episodic],
    };

    const contextSummary = this.generateContextSummary(profile, memories);

    return {
      renderContext,
      profile,
      semanticMemories: memories.semantic,
      episodicMemories: memories.episodic,
      contextSummary,
    };
  }

  /**
   * Build minimal context (just variables and profile)
   */
  async buildMinimalContext(
    clientId: string,
    variables: Record<string, unknown> = {}
  ): Promise<PromptRenderContext> {
    const profile = await clientProfileService.getProfile(clientId);

    return {
      variables,
      client_profile: profile || undefined,
    };
  }

  /**
   * Enrich variables with profile data
   */
  async enrichVariables(
    clientId: string,
    baseVariables: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const profile = await clientProfileService.getProfile(clientId);
    if (!profile) return baseVariables;

    return {
      ...baseVariables,
      // Add profile-derived variables
      client_voice_tone: profile.voice_preferences?.tone || 'professional',
      client_formality: profile.voice_preferences?.formality || 'professional',
      client_risk_level: profile.risk_level,
      client_preferred_structure: profile.preferred_structure,
    };
  }

  /**
   * Generate system prompt additions based on profile
   */
  generateSystemPromptAdditions(profile: ClientProfile): string {
    const additions: string[] = [];

    // Voice preferences
    if (profile.voice_preferences) {
      const voice = profile.voice_preferences;
      if (voice.tone) {
        additions.push(`Maintain a ${voice.tone} tone.`);
      }
      if (voice.formality) {
        additions.push(`Use ${voice.formality} language.`);
      }
      if (voice.personality && voice.personality.length > 0) {
        additions.push(`Personality traits to embody: ${voice.personality.join(', ')}.`);
      }
    }

    // Structure preferences
    const structureInstructions: Record<string, string> = {
      bullets: 'Use bullet points for key information.',
      concise: 'Keep responses brief and to the point.',
      narrative: 'Use a storytelling approach.',
      detailed: 'Provide comprehensive, detailed responses.',
    };

    if (profile.preferred_structure && structureInstructions[profile.preferred_structure]) {
      additions.push(structureInstructions[profile.preferred_structure]);
    }

    // Do not say list
    if (profile.do_not_say && profile.do_not_say.length > 0) {
      additions.push(`NEVER use these words/phrases: ${profile.do_not_say.join(', ')}.`);
    }

    // Risk level adjustments
    const riskInstructions: Record<string, string> = {
      low: 'Use conservative language and avoid aggressive claims.',
      medium: 'Balance confidence with appropriate hedging.',
      high: 'Be bold and confident in assertions.',
    };

    if (profile.risk_level && riskInstructions[profile.risk_level]) {
      additions.push(riskInstructions[profile.risk_level]);
    }

    return additions.join('\n');
  }

  /**
   * Format memories as context text
   */
  formatMemoriesAsContext(memories: {
    semantic: ClientMemory[];
    episodic: ClientMemory[];
  }): string {
    const sections: string[] = [];

    if (memories.semantic.length > 0) {
      sections.push('## Known Facts About This Client');
      for (const mem of memories.semantic) {
        sections.push(`- ${mem.key}: ${this.formatValue(mem.value)}`);
      }
    }

    if (memories.episodic.length > 0) {
      sections.push('\n## Recent Interactions');
      for (const mem of memories.episodic) {
        const timestamp = mem.value.timestamp as string || mem.created_at;
        sections.push(`- [${new Date(timestamp).toLocaleDateString()}] ${mem.value.type || mem.key}`);
        if (mem.value.outcome) {
          sections.push(`  Outcome: ${mem.value.outcome}`);
        }
      }
    }

    return sections.join('\n');
  }

  /**
   * Merge multiple contexts (for multi-client scenarios)
   */
  mergeContexts(...contexts: BuiltContext[]): BuiltContext {
    const mergedVariables: Record<string, unknown> = {};
    const allSemantic: ClientMemory[] = [];
    const allEpisodic: ClientMemory[] = [];

    for (const ctx of contexts) {
      Object.assign(mergedVariables, ctx.renderContext.variables);
      allSemantic.push(...ctx.semanticMemories);
      allEpisodic.push(...ctx.episodicMemories);
    }

    // Use the first profile as primary (could implement merging logic)
    const primaryProfile = contexts.find(c => c.profile)?.profile || null;

    return {
      renderContext: {
        variables: mergedVariables,
        client_profile: primaryProfile || undefined,
        memories: [...allSemantic, ...allEpisodic],
      },
      profile: primaryProfile,
      semanticMemories: allSemantic,
      episodicMemories: allEpisodic,
      contextSummary: contexts.map(c => c.contextSummary).join('\n---\n'),
    };
  }

  private async getRelevantMemories(clientId: string): Promise<{
    semantic: ClientMemory[];
    episodic: ClientMemory[];
  }> {
    const [semantic, episodic] = await Promise.all([
      this.config.includeSemanticMemory
        ? memoryService.query({
            client_id: clientId,
            memory_type: 'semantic',
            min_relevance: this.config.minRelevanceScore,
            limit: this.config.maxSemanticMemories,
          })
        : [],
      this.config.includeEpisodicMemory
        ? memoryService.query({
            client_id: clientId,
            memory_type: 'episodic',
            min_relevance: this.config.minRelevanceScore,
            limit: this.config.maxEpisodicMemories,
          })
        : [],
    ]);

    return { semantic, episodic };
  }

  private generateContextSummary(
    profile: ClientProfile | null,
    memories: { semantic: ClientMemory[]; episodic: ClientMemory[] }
  ): string {
    const parts: string[] = [];

    if (profile) {
      parts.push(`Profile: ${profile.preferred_structure} structure, ${profile.risk_level} risk`);
      if (profile.voice_preferences?.tone) {
        parts.push(`Voice: ${profile.voice_preferences.tone}`);
      }
    }

    parts.push(`Semantic memories: ${memories.semantic.length}`);
    parts.push(`Episodic memories: ${memories.episodic.length}`);

    return parts.join(' | ');
  }

  private formatValue(value: Record<string, unknown>): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);

    // For objects, try to extract a meaningful summary
    if (value.summary) return String(value.summary);
    if (value.description) return String(value.description);
    if (value.value) return String(value.value);

    // Fallback to JSON
    return JSON.stringify(value);
  }
}

export const contextBuilder = new ContextBuilder();
