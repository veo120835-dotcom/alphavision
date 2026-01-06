import { supabase } from '@/integrations/supabase/client';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unified-api`;

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  };
}

// Session Management
export async function createSession(title?: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/v1/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title })
  });
  if (!response.ok) throw new Error('Failed to create session');
  return response.json();
}

export async function getSession(sessionId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/v1/sessions/${sessionId}`, {
    method: 'GET',
    headers
  });
  if (!response.ok) throw new Error('Failed to get session');
  return response.json();
}

// Chat
export interface ChatSendRequest {
  session_id: string;
  message: {
    text: string;
    attachments?: Array<{
      type: 'file' | 'url' | 'text';
      name?: string;
      url?: string;
      text?: string;
      mime_type?: string;
    }>;
  };
  ui_state?: {
    mode: 'advisor' | 'operator' | 'autopilot';
    risk?: {
      personal: 'conservative' | 'balanced' | 'aggressive';
      ops: 'conservative' | 'balanced' | 'aggressive';
      marketing: 'conservative' | 'balanced' | 'aggressive';
    };
  };
  client_context?: {
    timezone?: string;
    locale?: string;
  };
}

export async function sendChatMessage(request: ChatSendRequest) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/v1/chat/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...request,
      client_context: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language,
        ...request.client_context
      }
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send message');
  }
  return response.json();
}

// Policy
export async function getPolicy() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/v1/policy`, {
    method: 'GET',
    headers
  });
  if (!response.ok) throw new Error('Failed to get policy');
  return response.json();
}

export async function updatePolicy(policy: Record<string, unknown>) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/v1/policy`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(policy)
  });
  if (!response.ok) throw new Error('Failed to update policy');
  return response.json();
}

// Actions
export async function getActions(status?: string, limit = 20, cursor?: string) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (limit) params.set('limit', limit.toString());
  if (cursor) params.set('cursor', cursor);
  
  const response = await fetch(`${API_BASE}/v1/actions?${params}`, {
    method: 'GET',
    headers
  });
  if (!response.ok) throw new Error('Failed to get actions');
  return response.json();
}

export async function approveAction(actionId: string, overrideReason?: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/v1/actions/${actionId}/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      approve: true,
      override_reason: overrideReason,
      confirm: {
        understands_cost: true,
        understands_irreversibility: false
      }
    })
  });
  if (!response.ok) throw new Error('Failed to approve action');
  return response.json();
}

export async function denyAction(actionId: string, reason?: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/v1/actions/${actionId}/deny`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ deny: true, reason })
  });
  if (!response.ok) throw new Error('Failed to deny action');
  return response.json();
}

// Decisions
export async function getDecisions(limit = 20, cursor?: string) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit.toString());
  if (cursor) params.set('cursor', cursor);
  
  const response = await fetch(`${API_BASE}/v1/decisions?${params}`, {
    method: 'GET',
    headers
  });
  if (!response.ok) throw new Error('Failed to get decisions');
  return response.json();
}

export async function getDecision(decisionId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/v1/decisions/${decisionId}`, {
    method: 'GET',
    headers
  });
  if (!response.ok) throw new Error('Failed to get decision');
  return response.json();
}

// Impact Report
export async function getImpactReport(from?: string, to?: string) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  
  const response = await fetch(`${API_BASE}/v1/impact/report?${params}`, {
    method: 'GET',
    headers
  });
  if (!response.ok) throw new Error('Failed to get impact report');
  return response.json();
}

// File Uploads
export async function getUploadUrl(filename: string, mimeType: string, sizeBytes: number) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}/v1/uploads/sign`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ filename, mime_type: mimeType, size_bytes: sizeBytes })
  });
  if (!response.ok) throw new Error('Failed to get upload URL');
  return response.json();
}

export async function uploadFile(file: File): Promise<string> {
  const { upload_url, file_path } = await getUploadUrl(file.name, file.type, file.size);
  
  const uploadResponse = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file
  });
  
  if (!uploadResponse.ok) throw new Error('Failed to upload file');
  
  return file_path;
}

// n8n Tool Trigger
export async function triggerN8nWorkflow(type: string, payload: Record<string, unknown>, workflow?: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhooks/v1/tools/trigger`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type, payload, workflow })
  });
  if (!response.ok) throw new Error('Failed to trigger workflow');
  return response.json();
}

// Convenience export
export const api = {
  sessions: { create: createSession, get: getSession },
  chat: { send: sendChatMessage },
  policy: { get: getPolicy, update: updatePolicy },
  actions: { list: getActions, approve: approveAction, deny: denyAction },
  decisions: { list: getDecisions, get: getDecision },
  impact: { report: getImpactReport },
  uploads: { getUrl: getUploadUrl, upload: uploadFile },
  n8n: { trigger: triggerN8nWorkflow }
};

export default api;
