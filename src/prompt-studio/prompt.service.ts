import { supabase } from '@/integrations/supabase/client';
import type { PromptTemplate, PromptScope, PromptStatus, PromptVariable, PromptConstraint } from './types';

export interface CreatePromptInput {
  client_id?: string;
  scope: PromptScope;
  name: string;
  description?: string;
  intent_tags: string[];
  template: string;
  variables?: PromptVariable[];
  constraints?: PromptConstraint;
  output_schema?: Record<string, unknown>;
}

export interface UpdatePromptInput {
  name?: string;
  description?: string;
  intent_tags?: string[];
  template?: string;
  variables?: PromptVariable[];
  constraints?: PromptConstraint;
  output_schema?: Record<string, unknown>;
  status?: PromptStatus;
}

export class PromptService {
  async createPrompt(input: CreatePromptInput): Promise<PromptTemplate> {
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('prompt_templates')
      .insert({
        client_id: input.client_id,
        scope: input.scope,
        name: input.name,
        description: input.description,
        intent_tags: input.intent_tags,
        template: input.template,
        variables: input.variables || [],
        constraints: input.constraints || {},
        output_schema: input.output_schema,
        created_by: user?.user?.id,
        status: 'draft',
        version: 1,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return this.mapToPromptTemplate(data);
  }

  async getPrompt(id: string): Promise<PromptTemplate | null> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapToPromptTemplate(data);
  }

  async getPromptsByClient(clientId: string): Promise<PromptTemplate[]> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToPromptTemplate);
  }

  async getPromptsByIntent(intent: string, clientId?: string): Promise<PromptTemplate[]> {
    let query = supabase
      .from('prompt_templates')
      .select('*')
      .contains('intent_tags', [intent])
      .in('status', ['active', 'champion']);

    if (clientId) {
      query = query.or(`client_id.eq.${clientId},scope.eq.global,scope.eq.domain`);
    }

    const { data, error } = await query.order('performance_score', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToPromptTemplate);
  }

  async getGlobalPrompts(): Promise<PromptTemplate[]> {
    const { data, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('scope', 'global')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToPromptTemplate);
  }

  async updatePrompt(id: string, input: UpdatePromptInput): Promise<PromptTemplate> {
    const updateData: Record<string, unknown> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.intent_tags !== undefined) updateData.intent_tags = input.intent_tags;
    if (input.template !== undefined) updateData.template = input.template;
    if (input.variables !== undefined) updateData.variables = input.variables;
    if (input.constraints !== undefined) updateData.constraints = input.constraints;
    if (input.output_schema !== undefined) updateData.output_schema = input.output_schema;
    if (input.status !== undefined) updateData.status = input.status;

    const { data, error } = await supabase
      .from('prompt_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToPromptTemplate(data);
  }

  async deletePrompt(id: string): Promise<void> {
    const { error } = await supabase
      .from('prompt_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async activatePrompt(id: string): Promise<PromptTemplate> {
    return this.updatePrompt(id, { status: 'active' });
  }

  async deprecatePrompt(id: string): Promise<PromptTemplate> {
    return this.updatePrompt(id, { status: 'deprecated' });
  }

  async promoteToChampion(id: string): Promise<PromptTemplate> {
    return this.updatePrompt(id, { status: 'champion' });
  }

  async demoteToChallenger(id: string): Promise<PromptTemplate> {
    return this.updatePrompt(id, { status: 'challenger' });
  }

  async searchPrompts(query: string, filters?: {
    scope?: PromptScope;
    status?: PromptStatus;
    client_id?: string;
    intent_tags?: string[];
  }): Promise<PromptTemplate[]> {
    let dbQuery = supabase
      .from('prompt_templates')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,template.ilike.%${query}%`);

    if (filters?.scope) {
      dbQuery = dbQuery.eq('scope', filters.scope);
    }
    if (filters?.status) {
      dbQuery = dbQuery.eq('status', filters.status);
    }
    if (filters?.client_id) {
      dbQuery = dbQuery.eq('client_id', filters.client_id);
    }
    if (filters?.intent_tags && filters.intent_tags.length > 0) {
      dbQuery = dbQuery.overlaps('intent_tags', filters.intent_tags);
    }

    const { data, error } = await dbQuery.order('performance_score', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapToPromptTemplate);
  }

  private mapToPromptTemplate(data: Record<string, unknown>): PromptTemplate {
    return {
      id: data.id as string,
      client_id: data.client_id as string | undefined,
      scope: data.scope as PromptScope,
      name: data.name as string,
      description: data.description as string | undefined,
      intent_tags: (data.intent_tags as string[]) || [],
      template: data.template as string,
      variables: (data.variables as PromptVariable[]) || [],
      constraints: (data.constraints as PromptConstraint) || {},
      output_schema: data.output_schema as Record<string, unknown> | undefined,
      version: data.version as number,
      status: data.status as PromptStatus,
      parent_version_id: data.parent_version_id as string | undefined,
      performance_score: Number(data.performance_score) || 0,
      created_by: data.created_by as string | undefined,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  }
}

export const promptService = new PromptService();
