import type { ProviderAdapter, ProviderConfig } from './types';

export const ManyChatAdapter: ProviderAdapter = {
  name: 'manychat',

  isConfigured(config: ProviderConfig): boolean {
    return !!config.manychat_api_key;
  },

  validateConfig(config: ProviderConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.manychat_api_key) {
      errors.push('ManyChat API Key is required');
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
      return { success: false, error: 'ManyChat not configured' };
    }

    try {
      const messages: any[] = [];

      if (content) {
        messages.push({
          type: 'text',
          text: content
        });
      }

      if (mediaUrls && mediaUrls.length > 0) {
        mediaUrls.forEach(url => {
          messages.push({
            type: 'image',
            url: url
          });
        });
      }

      const response = await fetch('https://api.manychat.com/fb/sending/sendContent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.manychat_api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriber_id: to,
          data: {
            version: 'v2',
            content: {
              messages
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('ManyChat API error:', error);
        return { success: false, error: `ManyChat API error: ${error}` };
      }

      return { success: true };
    } catch (error) {
      console.error('ManyChat send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
