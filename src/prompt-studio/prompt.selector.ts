import { supabase } from '@/integrations/supabase/client';
import type { PromptTemplate, PromptSelectionContext, PromptRenderContext, ClientProfile, ClientMemory } from './types';

export interface SelectedPrompt {
  template: PromptTemplate;
  rendered_content: string;
  selection_reason: string;
  fallback_used: boolean;
}

export class PromptSelectorService {
  /**
   * Select the best prompt for a given context
   * Priority: client-specific champion > client-specific active > domain > global
   */
  async selectPrompt(context: PromptSelectionContext): Promise<SelectedPrompt | null> {
    const { client_id, intent, additional_tags = [], prefer_champion = true } = context;

    // 1. Try client-specific champion
    if (prefer_champion) {
      const champion = await this.findPrompt({
        client_id,
        intent,
        additional_tags,
        status: 'champion',
        scope: 'client',
      });
      if (champion) {
        return this.prepareSelectedPrompt(champion, 'Client champion prompt', false);
      }
    }

    // 2. Try client-specific active
    const clientActive = await this.findPrompt({
      client_id,
      intent,
      additional_tags,
      status: 'active',
      scope: 'client',
    });
    if (clientActive) {
      return this.prepareSelectedPrompt(clientActive, 'Client active prompt', false);
    }

    // 3. Try domain-level
    const domainPrompt = await this.findPrompt({
      intent,
      additional_tags,
      status: prefer_champion ? 'champion' : 'active',
      scope: 'domain',
    });
    if (domainPrompt) {
      return this.prepareSelectedPrompt(domainPrompt, 'Domain prompt', true);
    }

    // 4. Try global
    const globalPrompt = await this.findPrompt({
      intent,
      additional_tags,
      status: prefer_champion ? 'champion' : 'active',
      scope: 'global',
    });
    if (globalPrompt) {
      return this.prepareSelectedPrompt(globalPrompt, 'Global prompt', true);
    }

    // 5. Last resort: any active global prompt with matching intent
    const fallbackPrompt = await this.findPrompt({
      intent,
      status: 'active',
      scope: 'global',
    });
    if (fallbackPrompt) {
      return this.prepareSelectedPrompt(fallbackPrompt, 'Global fallback', true);
    }

    return null;
  }

  /**
   * Render a prompt with the given context (variables, profile, memories)
   */
  async renderPrompt(
    template: PromptTemplate,
    context: PromptRenderContext
  ): Promise<string> {
    let rendered = template.template;

    // Replace variables
    for (const [key, value] of Object.entries(context.variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Apply client profile constraints
    if (context.client_profile) {
      rendered = this.applyProfileConstraints(rendered, context.client_profile);
    }

    // Inject memory context if available
    if (context.memories && context.memories.length > 0) {
      rendered = this.injectMemoryContext(rendered, context.memories);
    }

    return rendered;
  }

  /**
   * Get all prompts that could match a context (for preview/testing)
   */
  async getMatchingPrompts(context: PromptSelectionContext): Promise<PromptTemplate[]> {
    const allTags = [context.intent, ...context.additional_tags || []];

    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .overlaps('intent_tags', allTags)
      .in('status', ['active', 'champion'])
      .order('performance_score', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToPromptTemplate);
  }

  private async findPrompt(criteria: {
    client_id?: string;
    intent: string;
    additional_tags?: string[];
    status: string;
    scope: string;
  }): Promise<PromptTemplate | null> {
    const allTags = [criteria.intent, ...(criteria.additional_tags || [])];

    let query = supabase
      .from('prompt_templates')
      .select('*')
      .contains('intent_tags', [criteria.intent])
      .eq('status', criteria.status as any)
      .eq('scope', criteria.scope as any);

    if (criteria.client_id && criteria.scope === 'client') {
      query = query.eq('client_id', criteria.client_id);
    }

    const { data, error } = await query
      .order('performance_score', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return this.mapToPromptTemplate(data[0]);
  }

  private applyProfileConstraints(content: string, profile: ClientProfile): string {
    let modified = content;

    // Filter out forbidden words/phrases
    if (profile.do_not_say && profile.do_not_say.length > 0) {
      for (const phrase of profile.do_not_say) {
        const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
        modified = modified.replace(regex, '');
      }
    }

    // Add style/structure hints at the beginning
    const structureHints: Record<string, string> = {
      bullets: '[Use bullet points for key information]',
      concise: '[Keep response brief and to the point]',
      narrative: '[Use a storytelling approach]',
      detailed: '[Provide comprehensive details]',
    };

    const hint = structureHints[profile.preferred_structure];
    if (hint && !modified.includes(hint)) {
      modified = `${hint}\n\n${modified}`;
    }

    return modified;
  }

  private injectMemoryContext(content: string, memories: ClientMemory[]): string {
    // Group memories by type
    const semantic = memories.filter(m => m.memory_type === 'semantic');
    const episodic = memories.filter(m => m.memory_type === 'episodic');

    let contextBlock = '';

    if (semantic.length > 0) {
      contextBlock += '\n\n[CONTEXT - Known Facts]\n';
      for (const mem of semantic.slice(0, 5)) {
        contextBlock += `- ${mem.key}: ${JSON.stringify(mem.value)}\n`;
      }
    }

    if (episodic.length > 0) {
      contextBlock += '\n\n[CONTEXT - Recent Interactions]\n';
      for (const mem of episodic.slice(0, 3)) {
        contextBlock += `- ${mem.key}: ${JSON.stringify(mem.value)}\n`;
      }
    }

    return content + contextBlock;
  }

  private async prepareSelectedPrompt(
    template: PromptTemplate,
    reason: string,
    fallback: boolean
  ): Promise<SelectedPrompt> {
    return {
      template,
      rendered_content: template.template,
      selection_reason: reason,
      fallback_used: fallback,
    };
  }

  private mapToPromptTemplate(data: Record<string, unknown>): PromptTemplate {
    return {
      id: data.id as string,
      client_id: data.client_id as string | undefined,
      scope: data.scope as PromptTemplate['scope'],
      name: data.name as string,
      description: data.description as string | undefined,
      intent_tags: (data.intent_tags as string[]) || [],
      template: data.template as string,
      variables: (data.variables as PromptTemplate['variables']) || [],
      constraints: (data.constraints as PromptTemplate['constraints']) || {},
      output_schema: data.output_schema as Record<string, unknown> | undefined,
      version: data.version as number,
      status: data.status as PromptTemplate['status'],
      parent_version_id: data.parent_version_id as string | undefined,
      performance_score: Number(data.performance_score) || 0,
      created_by: data.created_by as string | undefined,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  }
}

export const promptSelectorService = new PromptSelectorService();
