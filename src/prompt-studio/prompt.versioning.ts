import { supabase } from '@/integrations/supabase/client';
import type { PromptTemplate, VersionDiff, AuditLogEntry } from './types';
import { promptService } from './prompt.service';

export interface VersionInfo {
  version: number;
  created_at: string;
  created_by?: string;
  status: string;
  performance_score: number;
}

export class PromptVersioningService {
  /**
   * Create a new version of a prompt template
   * Copies the current template and increments the version number
   */
  async createNewVersion(promptId: string, changes: {
    template?: string;
    variables?: unknown[];
    constraints?: Record<string, unknown>;
  }): Promise<PromptTemplate> {
    const current = await promptService.getPrompt(promptId);
    if (!current) {
      throw new Error('Prompt not found');
    }

    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('prompt_templates')
      .insert({
        client_id: current.client_id,
        scope: current.scope,
        name: current.name,
        description: current.description,
        intent_tags: current.intent_tags,
        template: changes.template || current.template,
        variables: changes.variables || current.variables,
        constraints: changes.constraints || current.constraints,
        output_schema: current.output_schema,
        version: current.version + 1,
        status: 'draft',
        parent_version_id: current.id,
        created_by: user?.user?.id,
      } as any)
      .select()
      .single();

    if (error) throw error;

    // Log the version creation
    await this.logVersionChange(promptId, data.id as string, 'version_created', user?.user?.id);

    return this.mapToPromptTemplate(data);
  }

  /**
   * Get all versions of a prompt (by following parent_version_id chain)
   */
  async getVersionHistory(promptId: string): Promise<VersionInfo[]> {
    const versions: VersionInfo[] = [];
    let currentId: string | null = promptId;

    while (currentId) {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('id, version, created_at, created_by, status, performance_score, parent_version_id')
        .eq('id', currentId)
        .single();

      if (error || !data) break;

      versions.push({
        version: data.version as number,
        created_at: data.created_at as string,
        created_by: data.created_by as string | undefined,
        status: data.status as string,
        performance_score: Number(data.performance_score) || 0,
      });

      currentId = data.parent_version_id as string | null;
    }

    // Also get any child versions
    const { data: children } = await supabase
      .from('prompt_templates')
      .select('id, version, created_at, created_by, status, performance_score')
      .eq('parent_version_id', promptId);

    if (children) {
      for (const child of children) {
        versions.push({
          version: child.version as number,
          created_at: child.created_at as string,
          created_by: child.created_by as string | undefined,
          status: child.status as string,
          performance_score: Number(child.performance_score) || 0,
        });
      }
    }

    return versions.sort((a, b) => b.version - a.version);
  }

  /**
   * Compare two versions and return the differences
   */
  async compareVersions(versionAId: string, versionBId: string): Promise<VersionDiff[]> {
    const [versionA, versionB] = await Promise.all([
      promptService.getPrompt(versionAId),
      promptService.getPrompt(versionBId),
    ]);

    if (!versionA || !versionB) {
      throw new Error('One or both versions not found');
    }

    const diffs: VersionDiff[] = [];
    const fieldsToCompare = ['template', 'variables', 'constraints', 'intent_tags', 'output_schema'];

    for (const field of fieldsToCompare) {
      const oldValue = versionA[field as keyof PromptTemplate];
      const newValue = versionB[field as keyof PromptTemplate];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diffs.push({
          field,
          old_value: oldValue,
          new_value: newValue,
        });
      }
    }

    return diffs;
  }

  /**
   * Rollback to a previous version
   * Creates a new version with the content from the target version
   */
  async rollbackToVersion(currentPromptId: string, targetVersionId: string): Promise<PromptTemplate> {
    const target = await promptService.getPrompt(targetVersionId);
    if (!target) {
      throw new Error('Target version not found');
    }

    const newVersion = await this.createNewVersion(currentPromptId, {
      template: target.template,
      variables: target.variables,
      constraints: target.constraints,
    });

    const { data: user } = await supabase.auth.getUser();
    await this.logVersionChange(currentPromptId, newVersion.id, 'rollback', user?.user?.id, {
      rolled_back_from: currentPromptId,
      rolled_back_to: targetVersionId,
    });

    return newVersion;
  }

  /**
   * Publish a draft version (change status to active)
   */
  async publishVersion(promptId: string): Promise<PromptTemplate> {
    const prompt = await promptService.getPrompt(promptId);
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    if (prompt.status !== 'draft') {
      throw new Error('Only draft versions can be published');
    }

    const updated = await promptService.activatePrompt(promptId);

    const { data: user } = await supabase.auth.getUser();
    await this.logVersionChange(promptId, promptId, 'published', user?.user?.id);

    return updated;
  }

  /**
   * Get the latest active version for a prompt lineage
   */
  async getLatestActiveVersion(promptId: string): Promise<PromptTemplate | null> {
    const prompt = await promptService.getPrompt(promptId);
    if (!prompt) return null;

    // Get all versions in this lineage that are active or champion
    const { data } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('name', prompt.name)
      .eq('client_id', prompt.client_id || '')
      .in('status', ['active', 'champion'])
      .order('version', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return null;
    return this.mapToPromptTemplate(data[0]);
  }

  private async logVersionChange(
    oldVersionId: string,
    newVersionId: string,
    action: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: `prompt_${action}`,
      entity_type: 'prompt_template',
      entity_id: newVersionId,
      old_value: { version_id: oldVersionId },
      new_value: { version_id: newVersionId, ...metadata },
    });
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
      constraints: (data.constraints as unknown as PromptTemplate['constraints']) || {},
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

export const promptVersioningService = new PromptVersioningService();
