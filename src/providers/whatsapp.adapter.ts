import type { ProviderAdapter, ProviderConfig } from './types';

export const WhatsAppAdapter: ProviderAdapter = {
  name: 'whatsapp',

  isConfigured(config: ProviderConfig): boolean {
    return !!(
      config.whatsapp_business_account_id &&
      config.whatsapp_phone_number_id &&
      config.whatsapp_access_token
    );
  },

  validateConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.whatsapp_business_account_id) {
      errors.push('WhatsApp Business Account ID is required');
    }
    if (!config.whatsapp_phone_number_id) {
      errors.push('WhatsApp Phone Number ID is required');
    }
    if (!config.whatsapp_access_token) {
      errors.push('WhatsApp Access Token is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  async sendMessage(
    to: string,
    content: string,
    config: ProviderConfig,
    mediaUrls?: string[]
  ): Promise<{ success: boolean; external_id?: string; error?: string }> {
    if (!this.isConfigured(config)) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      const messagePayload: any = {
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: mediaUrls && mediaUrls.length > 0 ? 'image' : 'text',
      };

      if (mediaUrls && mediaUrls.length > 0) {
        messagePayload.image = {
          link: mediaUrls[0],
          caption: content
        };
      } else {
        messagePayload.text = { body: content };
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.whatsapp_phone_number_id}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.whatsapp_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messagePayload)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('WhatsApp API error:', error);
        return { success: false, error: `WhatsApp API error: ${error}` };
      }

      const result = await response.json();
      return {
        success: true,
        external_id: result.messages?.[0]?.id
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
