import type { ProviderAdapter, ProviderConfig } from './types';

export const GHLAdapter: ProviderAdapter = {
  name: 'ghl',

  isConfigured(config: ProviderConfig): boolean {
    return !!(config.ghl_access_token && config.ghl_location_id);
  },

  validateConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.ghl_access_token) {
      errors.push('GoHighLevel Access Token is required');
    }
    if (!config.ghl_location_id) {
      errors.push('GoHighLevel Location ID is required');
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
      return { success: false, error: 'GoHighLevel not configured' };
    }

    try {
      const messagePayload: any = {
        type: 'SMS',
        contactId: to,
        message: content
      };

      if (mediaUrls && mediaUrls.length > 0) {
        messagePayload.attachments = mediaUrls;
      }

      const response = await fetch(
        `https://rest.gohighlevel.com/v1/conversations/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.ghl_access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messagePayload)
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('GHL API error:', error);
        return { success: false, error: `GHL API error: ${error}` };
      }

      const result = await response.json();
      return {
        success: true,
        external_id: result.messageId
      };
    } catch (error) {
      console.error('GHL send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
