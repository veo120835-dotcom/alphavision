export type ProviderType = 'whatsapp' | 'sms' | 'email' | 'manychat' | 'ghl' | 'internal';

export interface ProviderConfig {
  whatsapp_business_account_id?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_access_token?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_phone_number?: string;
  sendgrid_api_key?: string;
  sendgrid_from_email?: string;
  manychat_api_key?: string;
  ghl_access_token?: string;
  ghl_location_id?: string;
}

export interface Message {
  id?: string;
  conversation_id: string;
  organization_id: string;
  direction: 'inbound' | 'outbound';
  channel: ProviderType;
  content: string;
  media_urls?: string[];
  external_id?: string;
  sender_id: string;
  recipient_id: string;
  metadata?: Record<string, any>;
  status: string;
  created_at?: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  channel: ProviderType;
  external_id: string;
  contact_info: {
    identifier: string;
    provider: ProviderType;
    name?: string;
    avatar?: string;
  };
  status: 'active' | 'snoozed' | 'closed';
  assigned_to?: string;
  assigned_agent_id?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  last_message_at: string;
  created_at: string;
}

export interface ProviderAdapter {
  name: ProviderType;
  isConfigured(config: ProviderConfig): boolean;
  sendMessage(to: string, content: string, config: ProviderConfig, mediaUrls?: string[]): Promise<{ success: boolean; external_id?: string; error?: string }>;
  validateConfig(config: ProviderConfig): { valid: boolean; errors: string[] };
}
