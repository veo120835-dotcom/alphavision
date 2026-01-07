import type { ProviderAdapter, ProviderType } from './types';
import { WhatsAppAdapter } from './whatsapp.adapter';
import { SMSAdapter } from './sms.adapter';
import { EmailAdapter } from './email.adapter';
import { ManyChatAdapter } from './manychat.adapter';
import { GHLAdapter } from './ghl.adapter';

export * from './types';

export const ProviderAdapters: Record<ProviderType, ProviderAdapter> = {
  whatsapp: WhatsAppAdapter,
  sms: SMSAdapter,
  email: EmailAdapter,
  manychat: ManyChatAdapter,
  ghl: GHLAdapter,
  internal: {
    name: 'internal',
    isConfigured: () => true,
    validateConfig: () => ({ valid: true, errors: [] }),
    sendMessage: async () => ({ success: true })
  }
};

export function getProviderAdapter(provider: ProviderType): ProviderAdapter {
  const adapter = ProviderAdapters[provider];
  if (!adapter) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  return adapter;
}

export function getConfiguredProviders(config: Record<string, any>): ProviderType[] {
  const providers: ProviderType[] = [];

  Object.entries(ProviderAdapters).forEach(([name, adapter]) => {
    if (adapter.isConfigured(config)) {
      providers.push(name as ProviderType);
    }
  });

  return providers;
}
